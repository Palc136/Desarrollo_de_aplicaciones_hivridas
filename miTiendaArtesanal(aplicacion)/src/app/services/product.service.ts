// ============================================================
// SERVICIO DE PRODUCTOS (ProductService)
// ------------------------------------------------------------
// Gestiona:
//   - Productos por defecto (hardcoded, no editables).
//   - Productos publicados por vendedores (Preferences).
//   - Filtrado por categoría, búsqueda, vendedor.
//   - CRUD (crear, leer, actualizar, eliminar productos).
//
// Persistencia:
//   - En Android: Preferences → CapacitorStorage.xml.
//   - En navegador: Preferences → IndexedDB.
//   - Fotos: Filesystem → /data/data/io.ionic.starter/files/
// ============================================================

import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

import type { Product } from '../models/product.model';

// Clave de Preferences para productos publicados por vendedores.
const PRODUCTS_KEY = 'seller_products';

// Correo del "vendedor" de los productos por defecto.
const DEFAULT_SELLER = 'seller@default.com';

@Injectable({ providedIn: 'root' })
export class ProductService {

  // ──────────────────────────────────────────────────────────
  // CATÁLOGO POR DEFECTO (no editable)
  // ──────────────────────────────────────────────────────────
  // Imágenes con texto descriptivo (no aleatorias).
  // Estas tarjetas las ve el comprador si no hay productos
  // de vendedores. Son la "demo" del marketplace.
  private defaultProducts: Product[] = [
    {
      id: 'def-001',
      category: 'artesanía',
      name: 'Mochila Wayúu',
      description: 'Tejida a mano por artesanas de La Guajira con hilos de algodón.',
      price: 180000,
      imageUrl: 'https://placehold.co/400x400/B85C1E/white?text=Mochila+Wayuu',
      sellerEmail: DEFAULT_SELLER,
      stock: 5,
      status: 'active',
    },
    {
      id: 'def-002',
      category: 'textil',
      name: 'Ruana de Lana',
      description: 'Abrigo tradicional de Boyacá, tejido en lana de oveja.',
      price: 250000,
      imageUrl: 'https://placehold.co/400x400/8B4513/white?text=Ruana+de+Lana',
      sellerEmail: DEFAULT_SELLER,
      stock: 3,
      status: 'active',
    },
    {
      id: 'def-003',
      category: 'joyería',
      name: 'Aretes de Plata',
      description: 'Joyería artesanal en plata 950 con diseño inspirado en la naturaleza.',
      price: 95000,
      imageUrl: 'https://placehold.co/400x400/C0C0C0/black?text=Aretes+de+Plata',
      sellerEmail: DEFAULT_SELLER,
      stock: 10,
      status: 'active',
    },
    {
      id: 'def-004',
      category: 'alimentos',
      name: 'Café Artesanal 500g',
      description: 'Café de origen del Huila, tostión media, molido o en grano.',
      price: 35000,
      imageUrl: 'https://placehold.co/400x400/3E2723/white?text=Cafe+Artesanal',
      sellerEmail: DEFAULT_SELLER,
      stock: 20,
      status: 'active',
    },
    {
      id: 'def-005',
      category: 'cuidado personal',
      name: 'Jabón de Coco',
      description: 'Jabón artesanal con aceite de coco y aroma natural.',
      price: 18000,
      imageUrl: 'https://placehold.co/400x400/FFF8E1/black?text=Jabon+de+Coco',
      sellerEmail: DEFAULT_SELLER,
      stock: 30,
      status: 'active',
    },
    {
      id: 'def-006',
      category: 'artesanía',
      name: 'Sombrero Vueltiao',
      description: 'Símbolo de la cultura colombiana, tejido en caña flecha.',
      price: 120000,
      imageUrl: 'https://placehold.co/400x400/FFF3E0/black?text=Sombrero+Vueltiao',
      sellerEmail: DEFAULT_SELLER,
      stock: 8,
      status: 'active',
    },
  ];

  // ──────────────────────────────────────────────────────────
  // LECTURA
  // ──────────────────────────────────────────────────────────

  /**
   * Devuelve TODOS los productos activos (por defecto + vendedores).
   * Filtra los suspendidos para que no se muestren al comprador.
   */
  async getAllActive(): Promise<Product[]> {
    const sellerProducts = await this.getSellerProducts();

    // Concatenamos por defecto + de vendedores, y filtramos
    // los que estén suspendidos.
    const all = [...this.defaultProducts, ...sellerProducts];
    return all.filter((p) => p.status === 'active');
  }

  /**
   * Devuelve solo los productos publicados por un vendedor.
   * Se usa en la pestaña "Mis productos" del vendedor.
   */
  async getBySeller(sellerEmail: string): Promise<Product[]> {
    const sellerProducts = await this.getSellerProducts();
    return sellerProducts.filter((p) => p.sellerEmail === sellerEmail);
  }

  /**
   * Devuelve un producto por su ID.
   */
  async getById(id: string): Promise<Product | undefined> {
    const all = await this.getAllActive();
    return all.find((p) => p.id === id);
  }

  // ──────────────────────────────────────────────────────────
  // ESCRITURA (solo vendedores)
  // ──────────────────────────────────────────────────────────

  /**
   * Publica un producto nuevo del vendedor.
   * El ID se genera con timestamp para garantizar unicidad.
   */
  async create(product: Omit<Product, 'id' | 'status'>): Promise<Product> {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      status: 'active',
    };

    const sellerProducts = await this.getSellerProducts();
    sellerProducts.push(newProduct);
    await this.persist(sellerProducts);

    return newProduct;
  }

  /**
   * Elimina un producto (solo si es del vendedor que lo pide).
   * También borra el archivo de imagen del sistema de archivos.
   */
  async delete(productId: string, sellerEmail: string): Promise<void> {
    const sellerProducts = await this.getSellerProducts();

    // Buscamos el producto para borrar su imagen antes.
    const target = sellerProducts.find((p) => p.id === productId);
    if (!target || target.sellerEmail !== sellerEmail) {
      // No existe o no es del vendedor: no hacemos nada.
      return;
    }

    // Borramos la imagen si es un archivo local (no URL de placehold).
    if (!target.imageUrl.startsWith('http')) {
      try {
        await Filesystem.deleteFile({
          path: target.imageUrl,
          directory: Directory.Data,
        });
      } catch {
        // Si ya no existe, ignoramos.
      }
    }

    // Quitamos el producto de la lista.
    const filtered = sellerProducts.filter((p) => p.id !== productId);
    await this.persist(filtered);
  }

  /**
   * Suspende un producto (solo admin).
   * El producto sigue existiendo pero no se muestra al comprador.
   */
  async suspend(productId: string, suspended: boolean): Promise<void> {
    const sellerProducts = await this.getSellerProducts();
    const target = sellerProducts.find((p) => p.id === productId);
    if (!target) return;

    target.status = suspended ? 'suspended' : 'active';
    await this.persist(sellerProducts);
  }

  // ──────────────────────────────────────────────────────────
  // HELPERS PRIVADOS
  // ──────────────────────────────────────────────────────────

  private async getSellerProducts(): Promise<Product[]> {
    const { value } = await Preferences.get({ key: PRODUCTS_KEY });
    return value ? (JSON.parse(value) as Product[]) : [];
  }

  private async persist(products: Product[]): Promise<void> {
    await Preferences.set({
      key: PRODUCTS_KEY,
      value: JSON.stringify(products),
    });
  }
}