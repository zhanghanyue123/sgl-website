export type ProductVariant = {
  sku?: string;
  options: { name: string; value: string }[];
  price?: number | null;
  inventory?: number | null;
  image?: string | null;
};

export type Product = {
  slug: string;
  originalHandle: string;
  title: string;
  category: string;
  price: number;
  priceLabel: string;
  badge?: string;
  images: string[];
  description: string;
  details: string[];
  variants: ProductVariant[];
  temporaryShopifyUrl?: string;
  buyLinks: {
    taobao?: string;
    miniProgram?: string;
    contact?: string;
  };
};

export const products: Product[] = [
  {
    "slug": "chrissy-p",
    "originalHandle": "chrissy-p",
    "title": "Chrissy P",
    "category": "Bikes / Frames",
    "price": 899.0,
    "priceLabel": "899",
    "badge": "2 Variants",
    "images": [
      "/products/optimized/sgl-product-001.webp",
      "/products/optimized/sgl-product-002.webp"
    ],
    "description": "Chrissy P from the original SeaGull Labs Shopify catalog. Keep this item as a product archive or replace this copy with the final frame description.",
    "details": [
      "2 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Size",
            "value": "48"
          },
          {
            "name": "Color",
            "value": "Black"
          }
        ],
        "price": 899.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-001.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "48"
          },
          {
            "name": "Option",
            "value": "Blue"
          }
        ],
        "price": 899.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-002.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/chrissy-p",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "chrissy-m",
    "originalHandle": "chrissy-m",
    "title": "Chrissy M",
    "category": "Bikes / Frames",
    "price": 1299.0,
    "priceLabel": "1299",
    "badge": "2 Variants",
    "images": [
      "/products/optimized/sgl-product-003.webp"
    ],
    "description": "Chrissy M from the original SeaGull Labs Shopify catalog. Keep this item as a product archive or replace this copy with the final frame description.",
    "details": [
      "Tags: Bike",
      "2 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Size",
            "value": "48"
          }
        ],
        "price": 1299.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-003.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          }
        ],
        "price": 1299.0,
        "inventory": 2,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/chrissy-m",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "chrissy",
    "originalHandle": "chrissy",
    "title": "Chrissy",
    "category": "Bikes / Frames",
    "price": 899.0,
    "priceLabel": "899",
    "badge": "8 Variants",
    "images": [
      "/products/optimized/sgl-product-004.webp",
      "/products/optimized/sgl-product-005.webp",
      "/products/optimized/sgl-product-006.webp"
    ],
    "description": "Chrissy from the original SeaGull Labs Shopify catalog. Keep this item as a product archive or replace this copy with the final frame description.",
    "details": [
      "Type: Bike",
      "8 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Size",
            "value": "48"
          },
          {
            "name": "Color",
            "value": "Grey"
          }
        ],
        "price": 899.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-005.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "48"
          },
          {
            "name": "Option",
            "value": "Pink"
          }
        ],
        "price": 899.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-006.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "48"
          },
          {
            "name": "Option",
            "value": "Beige"
          }
        ],
        "price": 899.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-004.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Black"
          }
        ],
        "price": 899.0,
        "inventory": 0,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Grey"
          }
        ],
        "price": 899.0,
        "inventory": 0,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Blue"
          }
        ],
        "price": 899.0,
        "inventory": 0,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Pink"
          }
        ],
        "price": 899.0,
        "inventory": 0,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Beige"
          }
        ],
        "price": 899.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/chrissy",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "chrissy-team",
    "originalHandle": "chrissy-team",
    "title": "Chrissy Team",
    "category": "Bikes / Frames",
    "price": 2299.0,
    "priceLabel": "2299–2499",
    "badge": "8 Variants",
    "images": [
      "/products/optimized/sgl-product-007.webp",
      "/products/optimized/sgl-product-008.webp",
      "/products/optimized/sgl-product-009.webp",
      "/products/optimized/sgl-product-010.webp"
    ],
    "description": "Chrissy Team from the original SeaGull Labs Shopify catalog. Keep this item as a product archive or replace this copy with the final frame description.",
    "details": [
      "Type: Bike",
      "Tags: Bike",
      "8 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Size",
            "value": "48"
          },
          {
            "name": "Color",
            "value": "White"
          }
        ],
        "price": 2299.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-009.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "48"
          },
          {
            "name": "Option",
            "value": "Red"
          }
        ],
        "price": 2499.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-007.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "48"
          },
          {
            "name": "Option",
            "value": "Light Green"
          }
        ],
        "price": 2299.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-008.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "48"
          },
          {
            "name": "Option",
            "value": "Dark Green"
          }
        ],
        "price": 2299.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-010.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "White"
          }
        ],
        "price": 2299.0,
        "inventory": 2,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Red"
          }
        ],
        "price": 2499.0,
        "inventory": 2,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Light Green"
          }
        ],
        "price": 2299.0,
        "inventory": 2,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Dark Green"
          }
        ],
        "price": 2299.0,
        "inventory": 2,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/chrissy-team",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "chrissy-special",
    "originalHandle": "chrissy-special",
    "title": "Chrissy Special",
    "category": "Bikes / Frames",
    "price": 1299.0,
    "priceLabel": "1299",
    "badge": "2 Variants",
    "images": [
      "/products/optimized/sgl-product-011.webp"
    ],
    "description": "Chrissy Special from the original SeaGull Labs Shopify catalog. Keep this item as a product archive or replace this copy with the final frame description.",
    "details": [
      "Type: Bike",
      "Tags: Bike",
      "2 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Size",
            "value": "48"
          },
          {
            "name": "Style",
            "value": "TT"
          }
        ],
        "price": 1299.0,
        "inventory": 2,
        "image": "/products/optimized/sgl-product-011.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "TT"
          }
        ],
        "price": 1299.0,
        "inventory": 2,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/chrissy-special",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "seat-bag",
    "originalHandle": "seat-bag",
    "title": "Seat Bag",
    "category": "Bags & Carry",
    "price": 30.0,
    "priceLabel": "30",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-012.webp",
      "/products/optimized/sgl-product-013.webp",
      "/products/optimized/sgl-product-014.webp"
    ],
    "description": "Seat Bag for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Type: bags"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 30.0,
        "inventory": 0,
        "image": "/products/optimized/sgl-product-012.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/seat-bag",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "socks",
    "originalHandle": "socks",
    "title": "Socks",
    "category": "Wear & Ride",
    "price": 18.0,
    "priceLabel": "18",
    "badge": "Shopify Import",
    "images": [
      "/products/placeholder-socks.svg"
    ],
    "description": "Socks for park loops, commuting, and daily movement.",
    "details": [
      "Type: Socks"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 18.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/socks",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "transporter-wheeled-duffel",
    "originalHandle": "transporter-wheeled-duffel",
    "title": "Bike Transport Case ｜ Carrier Bag",
    "category": "Bags & Carry",
    "price": 260.0,
    "priceLabel": "260",
    "badge": "Shopify Import",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "Bike Transport Case ｜ Carrier Bag for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Type: luggage"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 260.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/transporter-wheeled-duffel",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "sports-bandana-outdoor-magic-scarf",
    "originalHandle": "sports-bandana-outdoor-magic-scarf",
    "title": "Sports Bandana | Outdoor Magic Scarf",
    "category": "Wear & Ride",
    "price": 20.0,
    "priceLabel": "20",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-015.webp",
      "/products/optimized/sgl-product-016.webp",
      "/products/optimized/sgl-product-017.webp",
      "/products/optimized/sgl-product-018.webp",
      "/products/optimized/sgl-product-019.webp",
      "/products/optimized/sgl-product-020.webp",
      "/products/optimized/sgl-product-021.webp"
    ],
    "description": "Sports Bandana | Outdoor Magic Scarf for park loops, commuting, and daily movement.",
    "details": [
      "Tags: Bandana"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Blue"
          }
        ],
        "price": 20.0,
        "inventory": 50,
        "image": "/products/optimized/sgl-product-016.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/sports-bandana-outdoor-magic-scarf",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "tote-bag-1",
    "originalHandle": "tote-bag-1",
    "title": "Tote Bag",
    "category": "Bags & Carry",
    "price": 0,
    "priceLabel": "TBD",
    "badge": "Shopify Import",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "Tote Bag for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Type: bags"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 0.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/tote-bag-1",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "toiletry-bag",
    "originalHandle": "toiletry-bag",
    "title": "Toiletry Bag",
    "category": "Bags & Carry",
    "price": 0,
    "priceLabel": "TBD",
    "badge": "Shopify Import",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "Toiletry Bag for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 0.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/toiletry-bag",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "bike-cover-l",
    "originalHandle": "bike-cover-l",
    "title": "Bike Cover L",
    "category": "Bags & Carry",
    "price": 0,
    "priceLabel": "TBD",
    "badge": "Shopify Import",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "18-22inch Bike",
    "details": [
      "Type: bags",
      "18-22inch Bike"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 0.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/bike-cover-l",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "shoe-sack-fot-travel",
    "originalHandle": "shoe-sack-fot-travel",
    "title": "Shoe Sack for Travel",
    "category": "Bags & Carry",
    "price": 0,
    "priceLabel": "TBD",
    "badge": "Shopify Import",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "Shoe Sack for Travel for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 0.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/shoe-sack-fot-travel",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "bike-cover",
    "originalHandle": "bike-cover",
    "title": "Bike Cover M",
    "category": "Bags & Carry",
    "price": 30.0,
    "priceLabel": "30",
    "badge": "5 Variants",
    "images": [
      "/products/optimized/sgl-product-022.webp",
      "/products/optimized/sgl-product-023.webp",
      "/products/optimized/sgl-product-024.webp",
      "/products/optimized/sgl-product-025.webp",
      "/products/optimized/sgl-product-026.webp"
    ],
    "description": "Bike Cover M for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Type: bags",
      "5 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Black"
          }
        ],
        "price": 30.0,
        "inventory": 50,
        "image": "/products/optimized/sgl-product-025.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Blue"
          }
        ],
        "price": 30.0,
        "inventory": 50,
        "image": "/products/optimized/sgl-product-024.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Green"
          }
        ],
        "price": 30.0,
        "inventory": 0,
        "image": "/products/optimized/sgl-product-022.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Purple"
          }
        ],
        "price": 30.0,
        "inventory": 50,
        "image": "/products/optimized/sgl-product-023.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Lemon Chiffon"
          }
        ],
        "price": 30.0,
        "inventory": 0,
        "image": "/products/optimized/sgl-product-026.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/bike-cover",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "reveal-shoe-sack",
    "originalHandle": "reveal-shoe-sack",
    "title": "Shoe Sack for Sport Shoes / Shoe Box",
    "category": "Bags & Carry",
    "price": 15.0,
    "priceLabel": "15",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-027.webp"
    ],
    "description": "Shoe Sack for Sport Shoes / Shoe Box for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Type: bags"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 15.0,
        "inventory": 0,
        "image": "/products/optimized/sgl-product-027.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/reveal-shoe-sack",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "sportglassea-case",
    "originalHandle": "sportglassea-case",
    "title": "Sportglasses Case ｜ Eyewear Cases",
    "category": "Bags & Carry",
    "price": 29.0,
    "priceLabel": "29",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-028.webp",
      "/products/optimized/sgl-product-029.webp",
      "/products/optimized/sgl-product-030.webp",
      "/products/optimized/sgl-product-031.webp"
    ],
    "description": "Sportglasses Case ｜ Eyewear Cases for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 29.0,
        "inventory": 0,
        "image": "/products/optimized/sgl-product-028.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/sportglassea-case",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "tote-bag",
    "originalHandle": "tote-bag",
    "title": "Tote Bag /Messenger Bag",
    "category": "Bags & Carry",
    "price": 102.0,
    "priceLabel": "102",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-032.webp",
      "/products/optimized/sgl-product-033.webp",
      "/products/optimized/sgl-product-034.webp",
      "/products/optimized/sgl-product-035.webp",
      "/products/optimized/sgl-product-036.webp",
      "/products/optimized/sgl-product-037.webp"
    ],
    "description": "Tote Bag /Messenger Bag for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 102.0,
        "inventory": 0,
        "image": "/products/optimized/sgl-product-032.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/tote-bag",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "velvet-fleece-bicycle-handlebar-covers",
    "originalHandle": "velvet-fleece-bicycle-handlebar-covers",
    "title": "Velvet fleece bicycle handlebar Grips",
    "category": "Bags & Carry",
    "price": 22.0,
    "priceLabel": "22",
    "badge": "5 Variants",
    "images": [
      "/products/optimized/sgl-product-038.webp",
      "/products/optimized/sgl-product-039.webp",
      "/products/optimized/sgl-product-040.webp",
      "/products/optimized/sgl-product-041.webp",
      "/products/optimized/sgl-product-042.webp",
      "/products/optimized/sgl-product-043.webp",
      "/products/optimized/sgl-product-044.webp",
      "/products/optimized/sgl-product-045.webp",
      "/products/optimized/sgl-product-046.webp",
      "/products/optimized/sgl-product-047.webp"
    ],
    "description": "Velvet fleece bicycle handlebar Grips for city riding, station stops, travel, and everyday carry.",
    "details": [
      "5 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Black"
          }
        ],
        "price": 22.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-043.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Beige"
          }
        ],
        "price": 22.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-045.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Brown"
          }
        ],
        "price": 22.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-041.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Green"
          }
        ],
        "price": 22.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-047.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Blue"
          }
        ],
        "price": 22.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-039.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/velvet-fleece-bicycle-handlebar-covers",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "copy-of-overshoes-oversocks",
    "originalHandle": "copy-of-overshoes-oversocks",
    "title": "OverShoes ｜ OverSocks",
    "category": "Wear & Ride",
    "price": 0,
    "priceLabel": "TBD",
    "badge": "Shopify Import",
    "images": [
      "/products/placeholder-socks.svg"
    ],
    "description": "OverShoes ｜ OverSocks for park loops, commuting, and daily movement.",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 0.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/copy-of-overshoes-oversocks",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "airtag-case",
    "originalHandle": "airtag-case",
    "title": "AirTag Case",
    "category": "Bags & Carry",
    "price": 13.0,
    "priceLabel": "13",
    "badge": "Shopify Import",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "AirTag Case for city riding, station stops, travel, and everyday carry.",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Title",
            "value": "Default Title"
          }
        ],
        "price": 13.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/airtag-case",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "cycling-leg-strap-pant-strap",
    "originalHandle": "cycling-leg-strap-pant-strap",
    "title": "Cycling leg Strap ｜ Pant Strap",
    "category": "Wear & Ride",
    "price": 13.0,
    "priceLabel": "13",
    "badge": "5 Variants",
    "images": [
      "/products/optimized/sgl-product-048.webp",
      "/products/optimized/sgl-product-049.webp",
      "/products/optimized/sgl-product-050.webp",
      "/products/optimized/sgl-product-051.webp",
      "/products/optimized/sgl-product-052.webp",
      "/products/optimized/sgl-product-053.webp",
      "/products/optimized/sgl-product-054.webp"
    ],
    "description": "Safety at Night High Quality Material Highly Reflective Wide Application",
    "details": [
      "5 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Grey"
          }
        ],
        "price": 13.0,
        "inventory": 200,
        "image": "/products/optimized/sgl-product-050.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Purple"
          }
        ],
        "price": 13.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-052.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Blue"
          }
        ],
        "price": 13.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-053.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Transparent"
          }
        ],
        "price": 13.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-049.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Black"
          }
        ],
        "price": 13.0,
        "inventory": 100,
        "image": "/products/optimized/sgl-product-054.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/cycling-leg-strap-pant-strap",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "reflective-gear-safety-reflector-baby-seagull",
    "originalHandle": "reflective-gear-safety-reflector-baby-seagull",
    "title": "Reflective Gear | Safety Reflector Baby Seagull",
    "category": "Accessories",
    "price": 8.0,
    "priceLabel": "8",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-055.webp",
      "/products/optimized/sgl-product-056.webp",
      "/products/optimized/sgl-product-057.webp",
      "/products/optimized/sgl-product-058.webp"
    ],
    "description": "Safety at Night High Quality Material Highly Reflective Wide Application",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Grey"
          }
        ],
        "price": 8.0,
        "inventory": 500,
        "image": "/products/optimized/sgl-product-055.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/reflective-gear-safety-reflector-baby-seagull",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "pin",
    "originalHandle": "pin",
    "title": "Three Seagulls Pin",
    "category": "Accessories",
    "price": 13.0,
    "priceLabel": "13",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-059.webp",
      "/products/optimized/sgl-product-060.webp",
      "/products/optimized/sgl-product-061.webp",
      "/products/optimized/sgl-product-062.webp",
      "/products/optimized/sgl-product-063.webp",
      "/products/optimized/sgl-product-064.webp"
    ],
    "description": "Three Seagulls Pin for safer, lighter, and more playful city movement.",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Material",
            "value": "Zinc Alloy"
          }
        ],
        "price": 13.0,
        "inventory": 500,
        "image": "/products/optimized/sgl-product-061.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/pin",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "handlebar-bags-purple",
    "originalHandle": "handlebar-bags-purple",
    "title": "Handlebar Bags Purple",
    "category": "Bags & Carry",
    "price": 50.0,
    "priceLabel": "50",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-065.webp",
      "/products/optimized/sgl-product-066.webp",
      "/products/optimized/sgl-product-067.webp",
      "/products/optimized/sgl-product-068.webp"
    ],
    "description": "Water-resistant Practical Functionality External stretch mesh pocket",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Purple"
          }
        ],
        "price": 50.0,
        "inventory": 55,
        "image": "/products/optimized/sgl-product-068.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/handlebar-bags-purple",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "handlebar-bags-reflect-grey",
    "originalHandle": "handlebar-bags-reflect-grey",
    "title": "Handlebar Bags  Grey/Orange",
    "category": "Bags & Carry",
    "price": 55.0,
    "priceLabel": "55",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-069.webp"
    ],
    "description": "Water-resistant Practical Functionality External stretch mesh pocket",
    "details": [
      "Type: bags"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Grey/Orange",
            "value": "Orange"
          }
        ],
        "price": 55.0,
        "inventory": 55,
        "image": "/products/optimized/sgl-product-069.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/handlebar-bags-reflect-grey",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "handleber-bags-red",
    "originalHandle": "handleber-bags-red",
    "title": "Handlebar Bags Red",
    "category": "Bags & Carry",
    "price": 50.0,
    "priceLabel": "50",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-070.webp",
      "/products/optimized/sgl-product-071.webp",
      "/products/optimized/sgl-product-072.webp",
      "/products/optimized/sgl-product-073.webp"
    ],
    "description": "Water-resistant Practical Functionality External stretch mesh pocket",
    "details": [
      "Type: bags"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Red"
          }
        ],
        "price": 50.0,
        "inventory": 55,
        "image": "/products/optimized/sgl-product-070.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/handleber-bags-red",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "handleber-bags-grey",
    "originalHandle": "handleber-bags-grey",
    "title": "Handlebar Bags Grey",
    "category": "Bags & Carry",
    "price": 50.0,
    "priceLabel": "50",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-074.webp"
    ],
    "description": "Water-resistant Practical Functionality External stretch mesh pocket",
    "details": [
      "Type: bags"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Grey"
          }
        ],
        "price": 50.0,
        "inventory": 50,
        "image": "/products/optimized/sgl-product-074.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/handleber-bags-grey",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "handlebar-bags",
    "originalHandle": "handlebar-bags",
    "title": "Handlebar Bags Black",
    "category": "Bags & Carry",
    "price": 55.0,
    "priceLabel": "55",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-075.webp",
      "/products/optimized/sgl-product-076.webp",
      "/products/optimized/sgl-product-077.webp",
      "/products/optimized/sgl-product-078.webp",
      "/products/optimized/sgl-product-079.webp",
      "/products/optimized/sgl-product-080.webp"
    ],
    "description": "Water-resistant Practical Functionality External stretch mesh pocket",
    "details": [
      "Type: bags"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Black"
          }
        ],
        "price": 55.0,
        "inventory": 50,
        "image": "/products/optimized/sgl-product-075.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/handlebar-bags",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "chrissy1",
    "originalHandle": "chrissy1",
    "title": "Chrissy Ti",
    "category": "Bikes / Frames",
    "price": 1999.0,
    "priceLabel": "1999",
    "badge": "7 Variants",
    "images": [
      "/products/optimized/sgl-product-081.webp"
    ],
    "description": "Chrissy Ti from the original SeaGull Labs Shopify catalog. Keep this item as a product archive or replace this copy with the final frame description.",
    "details": [
      "7 variants imported from Shopify"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Ti"
          },
          {
            "name": "Size",
            "value": "48"
          },
          {
            "name": "Style",
            "value": "Bend"
          }
        ],
        "price": 1999.0,
        "inventory": 3,
        "image": "/products/optimized/sgl-product-081.webp"
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Ti"
          },
          {
            "name": "Option",
            "value": "48"
          },
          {
            "name": "Option",
            "value": "straight line"
          }
        ],
        "price": 1999.0,
        "inventory": 0,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Ti"
          },
          {
            "name": "Option",
            "value": "48"
          },
          {
            "name": "Option",
            "value": "TT"
          }
        ],
        "price": 1999.0,
        "inventory": 0,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Ti"
          },
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "Bend"
          }
        ],
        "price": 1999.0,
        "inventory": 50,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Ti"
          },
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "straight line"
          }
        ],
        "price": 1999.0,
        "inventory": 0,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Ti"
          },
          {
            "name": "Option",
            "value": "50"
          },
          {
            "name": "Option",
            "value": "TT"
          }
        ],
        "price": 1999.0,
        "inventory": 0,
        "image": null
      },
      {
        "sku": "",
        "options": [
          {
            "name": "Option",
            "value": "Ti"
          },
          {
            "name": "Option",
            "value": "1"
          },
          {
            "name": "Option",
            "value": "1"
          }
        ],
        "price": 1999.0,
        "inventory": 0,
        "image": null
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/chrissy1",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  },
  {
    "slug": "cover",
    "originalHandle": "cover",
    "title": "Reflective Gear | Safety Reflector Biking",
    "category": "Bags & Carry",
    "price": 13.0,
    "priceLabel": "13",
    "badge": "Shopify Import",
    "images": [
      "/products/optimized/sgl-product-082.webp",
      "/products/optimized/sgl-product-083.webp",
      "/products/optimized/sgl-product-084.webp",
      "/products/optimized/sgl-product-085.webp"
    ],
    "description": "Safety at Night High Quality Material Highly Reflective Wide Application",
    "details": [
      "Imported from Shopify export",
      "Replace with final product copy when ready"
    ],
    "variants": [
      {
        "sku": "",
        "options": [
          {
            "name": "Color",
            "value": "Grey"
          }
        ],
        "price": 13.0,
        "inventory": 1000,
        "image": "/products/optimized/sgl-product-082.webp"
      }
    ],
    "temporaryShopifyUrl": "https://581ff0-3.myshopify.com/products/cover",
    "buyLinks": {
      "taobao": "",
      "miniProgram": "",
      "contact": "/about"
    }
  }
];

export function isProductReadyForStorefront(product: Product) {
  const hasImage = product.images.some(
    (image) => typeof image === "string" && image.trim().length > 0 && !/placeholder/i.test(image)
  );
  const normalizedPriceLabel = product.priceLabel.trim().toLowerCase();
  const hasPrice =
    Number.isFinite(product.price) &&
    product.price > 0 &&
    normalizedPriceLabel.length > 0 &&
    normalizedPriceLabel !== "tbd" &&
    normalizedPriceLabel !== "0";

  return hasImage && hasPrice;
}

export const storefrontProducts = products.filter(isProductReadyForStorefront);

export const categories = Array.from(
  new Set(storefrontProducts.map((product) => product.category))
);

export function getProduct(slug: string) {
  return storefrontProducts.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: string) {
  return storefrontProducts.filter((product) => product.category === category);
}
