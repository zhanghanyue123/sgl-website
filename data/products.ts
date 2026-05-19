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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/5cad0ba2531be0c6694129ca0393463f.png?v=1717040536",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/fab3c25ae934bf4c659bc683ee646a63.png?v=1717040536"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/5cad0ba2531be0c6694129ca0393463f.png?v=1717040536"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/fab3c25ae934bf4c659bc683ee646a63.png?v=1717040536"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/316b3cdb48567ea0ce54f959c96fd33a.png?v=1717040776"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/316b3cdb48567ea0ce54f959c96fd33a.png?v=1717040776"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/9508a9cd68ce444753a0a7f3843f6aac.png?v=1717040536",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/8726df84df505089d9b86d5dba33c721.png?v=1717040536",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/0ca7fdeac21b1d66b2bee418e1131efd.png?v=1717040536"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/8726df84df505089d9b86d5dba33c721.png?v=1717040536"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/0ca7fdeac21b1d66b2bee418e1131efd.png?v=1717040536"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/9508a9cd68ce444753a0a7f3843f6aac.png?v=1717040536"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/3440fa71b65f61d3f1bea09b3735c491.png?v=1717040319",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/abc4343430c334f422fb1b2a17b7d946.png?v=1717040319",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/29abe6c5159c71afe639e2df8671dece.png?v=1717040319",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/7716e8bad878204858d4880bd3a0e089.png?v=1717040319"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/29abe6c5159c71afe639e2df8671dece.png?v=1717040319"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/3440fa71b65f61d3f1bea09b3735c491.png?v=1717040319"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/abc4343430c334f422fb1b2a17b7d946.png?v=1717040319"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/7716e8bad878204858d4880bd3a0e089.png?v=1717040319"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2459ccee65de1f2b77f7307ddf78489a.png?v=1717040059"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2459ccee65de1f2b77f7307ddf78489a.png?v=1717040059"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-2511.48.40.png?v=1719287511",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-2511.48.54.png?v=1719287511",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-2511.50.19.png?v=1719287440"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-2511.48.40.png?v=1719287511"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.54.46.png?v=1719287736",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.55.11.png?v=1719287743",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.54.12.png?v=1719287746",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/1021.png?v=1719287756",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/102.png?v=1719287756",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/1023.png?v=1719287756",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/10.png?v=1719287756"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.55.11.png?v=1719287743"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-39.jpg?v=1717831285",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-42.jpg?v=1717831285",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-12.jpg?v=1717831286",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-10.jpg?v=1717831285",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-17.jpg?v=1717831285"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-10.jpg?v=1717831285"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-12.jpg?v=1717831286"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-39.jpg?v=1717831285"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-42.jpg?v=1717831285"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-17.jpg?v=1717831285"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/27_1.jpg?v=1719291108"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/27_1.jpg?v=1719291108"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.44.48.png?v=1719287108",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-2511.41.11.png?v=1719287124",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.41.50.png?v=1719286971",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.42.17.png?v=1719286972"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.44.48.png?v=1719287108"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/20.jpg?v=1719285937",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.28.00.png?v=1719286103",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/24.jpg?v=1719286122",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/23.jpg?v=1719286122",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/53.jpg?v=1719286122",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/22.jpg?v=1719286122"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/20.jpg?v=1719285937"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/1d263af03646d50fbf3924b6b14e2ec0.jpg?v=1710841633",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/64789c53b63938adac67e68485e022e0.jpg?v=1710841677",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/240b1ce4f30093d99d675cefb14ce06a.jpg?v=1710842488",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/7ee22d92ff8fad0f57ab8858e7ac65bb.jpg?v=1710842488",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/1052bc4ee71c8821ea2c2d09cdfeab98.jpg?v=1710842492",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/f8d9617846214319a0b9ba480c7456d9.jpg?v=1710844991",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/a165b05e676c418b3f68b44bfe2d0f66.jpg?v=1710844991",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/ca9d9c942288e6de0a145b68a65d8545.jpg?v=1710844991",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/f55eca1a974d92d4354a62d23334bc11.jpg?v=1710844991",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/a77ab431e00cdb0a5f85b89cf903c24c.jpg?v=1710844991"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/f8d9617846214319a0b9ba480c7456d9.jpg?v=1710844991"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/ca9d9c942288e6de0a145b68a65d8545.jpg?v=1710844991"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/7ee22d92ff8fad0f57ab8858e7ac65bb.jpg?v=1710842488"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/a77ab431e00cdb0a5f85b89cf903c24c.jpg?v=1710844991"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/64789c53b63938adac67e68485e022e0.jpg?v=1710841677"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-7.jpg?v=1717831955",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/59_639bc3be-48e4-4433-9bbf-822034f3f2fe.jpg?v=1719286648",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bdf.png?v=1719286681",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bdb.png?v=1719286681",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/pur.png?v=1719286681",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/blu.png?v=1719286681",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bla.png?v=1719286681"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bdf.png?v=1719286681"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/pur.png?v=1719286681"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/blu.png?v=1719286681"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/59_639bc3be-48e4-4433-9bbf-822034f3f2fe.jpg?v=1719286648"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bla.png?v=1719286681"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/e59c495fabb75640a9641fe77beb3eff.png?v=1719290401",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_12.38.41.png?v=1719290343",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/DSC00568fr.png?v=1719290351",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/babyback.png?v=1719290351"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/e59c495fabb75640a9641fe77beb3eff.png?v=1719290401"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.58.01.png?v=1719287922",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_11.58.19.png?v=1719287923",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/pin.png?v=1719287934",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/91709735544_.pic_hd.jpg?v=1719287934",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/201709735622_.pic_hd.jpg?v=1719287934",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/71709735533_.pic_hd.jpg?v=1719287934"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/pin.png?v=1719287934"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-27.jpg?v=1717834968",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/861709736129_.pic_hd_742cb065-0d96-47cb-afa3-a467c81f2e59.jpg?v=1717834975",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/851709736120_.pic_hd_d19c256b-cfcb-4851-887a-bb01414192da.jpg?v=1717834975",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/821709736097_.pic_hd.png?v=1709987547"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/821709736097_.pic_hd.png?v=1709987547"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-54.jpg?v=1717834803"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-54.jpg?v=1717834803"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_12.02.49.png?v=1719288327",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/14.jpg?v=1719288196",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/901709736158_.pic_hd.jpg?v=1719288212",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/891709736152_.pic_hd.jpg?v=1709985159"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/2024-06-25_12.02.49.png?v=1719288327"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-31.png?v=1717835320"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-31.png?v=1717835320"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-26.jpg?v=1717834902",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/9_1.jpg?v=1719290014",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/691709735995_.pic_hd.jpg?v=1719290020",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/631709735950_.pic_hd.jpg?v=1719290020",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/641709735958_.pic_hd.jpg?v=1719290020",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/781709736064_.pic_hd.png?v=1719290020"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/bike-26.jpg?v=1717834902"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/b7a0f4e4e5c4c56f7cdaeb9f90b46e87.jpg?v=1716970070"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/b7a0f4e4e5c4c56f7cdaeb9f90b46e87.jpg?v=1716970070"
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
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/yinsesanjiao.png?v=1719290418",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/1.jpg?v=1719290418",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/DSC00568bl.png?v=1719290265",
      "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/DSC00568back.png?v=1719290265"
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
        "image": "https://cdn.shopify.com/s/files/1/0577/6536/3800/files/yinsesanjiao.png?v=1719290418"
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

export const categories = Array.from(new Set(products.map((product) => product.category)));

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: string) {
  return products.filter((product) => product.category === category);
}
