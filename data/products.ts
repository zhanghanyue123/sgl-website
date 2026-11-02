export type ProductVariant = {
  sku?: string;
  options: { name: string; value: string }[];
  price?: number | null;
  inventory?: number | null;
  soldOut?: boolean;
  image?: string | null;
};

export type Product = {
  hidden?: boolean;
  soldOut?: boolean;
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
  "slug": "sgl-three-pair-sock-set",
  "originalHandle": "sgl-three-pair-sock-set",
  "title": "SGL Three-Pair Sock Set",
  "category": "Wear & Ride",
  "price": 35,
  "priceLabel": "35",
  "images": [
    "/products/socks/sgl-three-pair-sock-set-studio.webp",
    "/products/socks/sgl-three-pair-sock-set-01.webp",
    "/products/socks/sgl-three-pair-sock-set-02.webp",
    "/products/socks/sgl-three-pair-sock-set-03.webp",
    "/products/socks/sgl-three-pair-sock-set-04.webp",
    "/products/socks/sgl-three-pair-sock-set-05.webp"
  ],
  "description": "A coordinated set of three SGL sock designs for everyday movement and riding.",
  "details": [
    "Set of three pairs",
    "Three coordinated SGL designs"
  ],
  "variants": [],
  "buyLinks": {
    "contact": "/contact"
  }
},
{
  "slug": "sgl-house-blend-01",
  "originalHandle": "sgl-house-blend-01",
  "title": "SGL House Blend 01 — 450g",
  "category": "Coffee & Refuel",
  "price": 18,
  "priceLabel": "18",
  "images": [
    "/products/sgl-house-blend-01.webp"
  ],
  "description": "A dark roast coffee blend with tasting notes of nuts, butter, honey and dark chocolate. Your everyday refuel, from SGL Station to home.",
  "details": [
    "Net weight: 450g",
    "Dark roast blend",
    "Origins: Costa Rica, Brazil and Uganda",
    "Tasting notes: nuts, butter, honey and dark chocolate",
    "Altitude: 1,200–1,800m"
  ],
  "variants": [],
  "buyLinks": {
    "contact": "/contact"
  }
},

{
  "slug": "seagull-cap-khaki-brown",
  "originalHandle": "seagull-cap-khaki-brown",
  "title": "Sea Gull Cap — Khaki / Brown",
  "category": "Wear & Ride",
  "price": 45,
  "priceLabel": "45",
  "images": [
    "/products/caps/khaki-brown-studio.webp",
    "/products/caps/khaki-brown-13.webp",
    "/products/caps/khaki-brown-14.webp"
  ],
  "description": "An everyday cap with embroidered Sea Gull branding.",
  "details": [
    "Embroidered Sea Gull logo"
  ],
  "variants": [],
  "buyLinks": {
    "contact": "/contact"
  }
},
{
  "slug": "seagull-cap-lavender",
  "soldOut": true,
  "originalHandle": "seagull-cap-lavender",
  "title": "Sea Gull Cap — Lavender",
  "category": "Wear & Ride",
  "price": 45,
  "priceLabel": "45",
  "images": [
    "/products/caps/lavender-studio.webp",
    "/products/caps/lavender-10.webp",
    "/products/caps/lavender-11.webp",
    "/products/caps/lavender-8.webp",
    "/products/caps/lavender-9.webp"
  ],
  "description": "An everyday cap with embroidered Sea Gull branding.",
  "details": [
    "Embroidered Sea Gull logo"
  ],
  "variants": [],
  "buyLinks": {
    "contact": "/contact"
  }
},
{
  "slug": "seagull-cap-black-grey",
  "originalHandle": "seagull-cap-black-grey",
  "title": "Sea Gull Cap — Black / Grey",
  "category": "Wear & Ride",
  "price": 45,
  "priceLabel": "45",
  "images": [
    "/products/caps/black-grey-studio.webp",
    "/products/caps/black-grey-7.webp",
    "/products/caps/black-grey-6.webp",
    "/products/caps/black-grey-5.webp"
  ],
  "description": "An everyday cap with embroidered Sea Gull branding.",
  "details": [
    "Embroidered Sea Gull logo"
  ],
  "variants": [],
  "buyLinks": {
    "contact": "/contact"
  }
},
{
  "slug": "seagull-friends-family-cap-white-blue",
  "originalHandle": "seagull-friends-family-cap-white-blue",
  "title": "Sea Gull Friends & Family Cap — White / Blue",
  "category": "Wear & Ride",
  "price": 50,
  "priceLabel": "50",
  "images": [
    "/products/caps/friends-family-white-blue.webp"
  ],
  "description": "A white and blue cap featuring embroidered Friends & Family artwork from Sea Gull Labs.",
  "details": [
    "Embroidered Friends & Family artwork"
  ],
  "variants": [],
  "buyLinks": {
    "contact": "/contact"
  }
},

  {
    "slug": "chrissy-p",
    "hidden": true,
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
    "description": "Chrissy P is a preserved SeaGull Labs bicycle model with an aluminum alloy frame. This record remains part of the product archive.",
    "details": [
      "Aluminum alloy frame",
      "Archived SGL bicycle model",
      "Size and colour options recorded"
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
    hidden: true,
    "originalHandle": "chrissy-m",
    "title": "Chrissy M",
    "category": "Bikes / Frames",
    "price": 1299.0,
    "priceLabel": "1299",
    "badge": "2 Variants",
    "images": [
      "/products/optimized/sgl-product-003.webp"
    ],
    "description": "Chrissy M is a preserved SeaGull Labs bicycle model with an aluminum alloy frame. This record remains part of the product archive.",
    "details": [
      "Aluminum alloy frame",
      "Archived SGL bicycle model",
      "Size options recorded"
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
    "description": "An original SeaGull Labs Chrissy bicycle model with an aluminum alloy frame. Contact SGL for current configuration, sizing and availability.",
    "details": [
      "Aluminum alloy frame",
      "Original SGL bicycle model",
      "Options vary by size and colour"
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
    "description": "The Chrissy Team is an original SeaGull Labs bicycle model with an aluminum alloy frame. Contact SGL for current configuration, sizing and availability.",
    "details": [
      "Aluminum alloy frame",
      "Original SGL bicycle model",
      "Options vary by size and colour"
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
    "description": "The Chrissy Special is an original SeaGull Labs bicycle model with an aluminum alloy frame. Contact SGL for current configuration, sizing and availability.",
    "details": [
      "Aluminum alloy frame",
      "Original SGL bicycle model",
      "Size and style options available"
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
    "soldOut": true,
    "originalHandle": "seat-bag",
    "title": "Seat Bag",
    "category": "Bags & Carry",
    "price": 30.0,
    "priceLabel": "30",
    "badge": "Everyday Carry",
    "images": [
      "/products/seat-bag-studio.webp",
      "/products/seat-bag-detail.webp"
    ],
    "description": "A compact SGL seat bag designed to carry small essentials beneath a bicycle saddle.",
    "details": [
      "Bicycle saddle bag"
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
        "image": "/products/seat-bag-studio.webp"
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
    "badge": "Archive",
    "images": [
      "/products/placeholder-socks.svg"
    ],
    "description": "A preserved SGL socks record awaiting confirmed imagery, specifications and sale status.",
    "details": [
      "Archived product record"
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
    "title": "Bike Transport Case / Carrier Bag",
    "category": "Bags & Carry",
    "price": 260.0,
    "priceLabel": "260",
    "badge": "Archive",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "A preserved SGL bicycle transport case record awaiting confirmed imagery, specifications and sale status.",
    "details": [
      "Archived product record"
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
    "title": "SGL Sports Bandana",
    "category": "Wear & Ride",
    "price": 20.0,
    "priceLabel": "20",
    "badge": "SGL Print",
    "images": [
      "/products/optimized/sgl-product-015.webp",
      "/products/optimized/sgl-product-016.webp",
      "/products/optimized/sgl-product-017.webp",
      "/products/optimized/sgl-product-018.webp",
      "/products/optimized/sgl-product-019.webp",
      "/products/optimized/sgl-product-020.webp",
      "/products/optimized/sgl-product-021.webp"
    ],
    "description": "A printed SGL sports bandana for riding, outdoor activity and everyday wear.",
    "details": [
      "Printed SGL design"
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
    hidden: true,
    "originalHandle": "tote-bag-1",
    "title": "Tote Bag",
    "category": "Bags & Carry",
    "price": 0,
    "priceLabel": "TBD",
    "badge": "Archive",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "A preserved SGL tote bag record retained as part of the product archive.",
    "details": [
      "Archived product record"
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
    "badge": "Archive",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "A preserved SGL toiletry bag record awaiting confirmed imagery, specifications and sale status.",
    "details": [
      "Archived product record"
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
    "badge": "Archive",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "An archived SGL bicycle cover record labelled for 18–22 inch bicycles.",
    "details": [
      "Recorded fit: 18–22 inch bicycles",
      "Archived product record"
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
    "title": "Travel Shoe Bag",
    "category": "Bags & Carry",
    "price": 0,
    "priceLabel": "TBD",
    "badge": "Archive",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "A preserved SGL travel shoe bag record awaiting confirmed imagery, specifications and sale status.",
    "details": [
      "Archived product record"
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
    "description": "An SGL bicycle cover in size M for covering a bicycle between rides.",
    "details": [
      "Size: M",
      "Colour options available"
    ],
    "variants": [
      {
        "sku": "",
        "soldOut": true,
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
        "soldOut": true,
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
    "title": "SGL Shoe Bag",
    "category": "Bags & Carry",
    "price": 15.0,
    "priceLabel": "15",
    "badge": "Travel",
    "images": [
      "/products/optimized/sgl-product-027.webp"
    ],
    "description": "A zippered SGL bag for carrying and separating a pair of shoes while travelling or training.",
    "details": [
      "Zippered shoe bag"
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
    "hidden": true,
    "originalHandle": "sportglassea-case",
    "title": "Sports Glasses Case",
    "category": "Bags & Carry",
    "price": 29.0,
    "priceLabel": "29",
    "badge": "Archive",
    "images": [
      "/products/optimized/sgl-product-028.webp",
      "/products/optimized/sgl-product-029.webp",
      "/products/optimized/sgl-product-030.webp",
      "/products/optimized/sgl-product-031.webp"
    ],
    "description": "A preserved SGL sports glasses case record retained as part of the product archive.",
    "details": [
      "Archived product record"
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
    hidden: true,
    "originalHandle": "tote-bag",
    "title": "Tote / Messenger Bag",
    "category": "Bags & Carry",
    "price": 102.0,
    "priceLabel": "102",
    "badge": "Archive",
    "images": [
      "/products/optimized/sgl-product-032.webp",
      "/products/optimized/sgl-product-033.webp",
      "/products/optimized/sgl-product-034.webp",
      "/products/optimized/sgl-product-035.webp",
      "/products/optimized/sgl-product-036.webp",
      "/products/optimized/sgl-product-037.webp"
    ],
    "description": "A preserved SGL tote and messenger bag record retained as part of the product archive.",
    "details": [
      "Archived product record"
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
    hidden: true,
    "originalHandle": "velvet-fleece-bicycle-handlebar-covers",
    "title": "Velvet Fleece Bicycle Handlebar Grips",
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
    "description": "A preserved SGL velvet fleece bicycle handlebar grip record retained as part of the product archive.",
    "details": [
      "Five colour options recorded",
      "Archived product record"
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
    "title": "Cycling Overshoes / Oversocks",
    "category": "Wear & Ride",
    "price": 0,
    "priceLabel": "TBD",
    "badge": "Archive",
    "images": [
      "/products/placeholder-socks.svg"
    ],
    "description": "A preserved SGL cycling overshoes and oversocks record awaiting confirmed imagery, specifications and sale status.",
    "details": [
      "Archived product record"
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
    "badge": "Archive",
    "images": [
      "/products/placeholder-bag.svg"
    ],
    "description": "A preserved SGL AirTag case record awaiting confirmed imagery, specifications and sale status.",
    "details": [
      "Archived product record"
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
    "title": "SGL Cycling Trouser Strap",
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
    "description": "A wraparound cycling strap designed to keep a trouser cuff close to the leg while riding.",
    "details": [
      "Five colour options"
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
    "title": "Baby Seagull Reflector",
    "category": "Accessories",
    "price": 8.0,
    "priceLabel": "8",
    "badge": "Character Gear",
    "images": [
      "/products/optimized/sgl-product-055.webp",
      "/products/optimized/sgl-product-056.webp",
      "/products/optimized/sgl-product-057.webp",
      "/products/optimized/sgl-product-058.webp"
    ],
    "description": "A hanging Baby Seagull reflector designed for bags, keys and everyday carry.",
    "details": [
      "Baby Seagull character design"
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
    "badge": "Set of Three",
    "images": [
      "/products/optimized/sgl-product-059.webp",
      "/products/optimized/sgl-product-060.webp",
      "/products/optimized/sgl-product-061.webp",
      "/products/optimized/sgl-product-062.webp",
      "/products/optimized/sgl-product-063.webp",
      "/products/optimized/sgl-product-064.webp"
    ],
    "description": "A set of three Seagull character pins presented together on an SGL card.",
    "details": [
      "Set of three pins",
      "Zinc alloy"
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
    "slug": "handlebar-bag-white-grey",
    "originalHandle": "handlebar-bag-white-grey",
    "title": "SGL Handlebar Bag — White / Grey",
    "category": "Bags & Carry",
    "price": 50.0,
    "priceLabel": "50",
    "badge": "White / Grey",
    "images": [
      "/products/handlebar-bag-white-grey.webp"
    ],
    "description": "A white and grey compact drawcord SGL bag designed to mount at the bicycle handlebar, with side mesh pockets for small essentials.",
    "details": [
      "Handlebar-mounted bag",
      "Drawcord closure",
      "Side mesh pockets"
    ],
    "variants": [],
    "buyLinks": {
      "contact": "/contact"
    }
  },
  {
    "slug": "handlebar-bags-purple",
    "originalHandle": "handlebar-bags-purple",
    "title": "SGL Handlebar Bag — Purple",
    "category": "Bags & Carry",
    "price": 50.0,
    "priceLabel": "50",
    "badge": "Purple",
    "images": [
      "/products/optimized/sgl-product-065.webp",
      "/products/optimized/sgl-product-066.webp",
      "/products/optimized/sgl-product-067.webp",
      "/products/optimized/sgl-product-068.webp"
    ],
    "description": "A compact drawcord SGL bag designed to mount at the bicycle handlebar, with side mesh pockets for small essentials.",
    "details": [
      "Handlebar-mounted bag",
      "Drawcord closure",
      "Side mesh pockets"
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
    "title": "SGL Handlebar Bag — Grey / Orange",
    "category": "Bags & Carry",
    "price": 55.0,
    "priceLabel": "55",
    "badge": "Grey / Orange",
    "images": [
      "/products/optimized/sgl-product-069.webp"
    ],
    "description": "A compact drawcord SGL bag designed to mount at the bicycle handlebar, with side mesh pockets for small essentials.",
    "details": [
      "Handlebar-mounted bag",
      "Drawcord closure",
      "Side mesh pockets"
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
    "title": "SGL Handlebar Bag — Red",
    "category": "Bags & Carry",
    "price": 50.0,
    "priceLabel": "50",
    "badge": "Red",
    "images": [
      "/products/optimized/sgl-product-070.webp",
      "/products/optimized/sgl-product-071.webp",
      "/products/optimized/sgl-product-072.webp",
      "/products/optimized/sgl-product-073.webp"
    ],
    "description": "A compact drawcord SGL bag designed to mount at the bicycle handlebar, with side mesh pockets for small essentials.",
    "details": [
      "Handlebar-mounted bag",
      "Drawcord closure",
      "Side mesh pockets"
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
    "title": "SGL Handlebar Bag — Grey",
    "category": "Bags & Carry",
    "price": 50.0,
    "priceLabel": "50",
    "badge": "Grey",
    "images": [
      "/products/optimized/sgl-product-074.webp"
    ],
    "description": "A compact drawcord SGL bag designed to mount at the bicycle handlebar, with side mesh pockets for small essentials.",
    "details": [
      "Handlebar-mounted bag",
      "Drawcord closure",
      "Side mesh pockets"
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
    "title": "SGL Handlebar Bag — Black",
    "category": "Bags & Carry",
    "price": 55.0,
    "priceLabel": "55",
    "badge": "Black",
    "images": [
      "/products/optimized/sgl-product-075.webp",
      "/products/optimized/sgl-product-076.webp",
      "/products/optimized/sgl-product-077.webp",
      "/products/optimized/sgl-product-078.webp",
      "/products/optimized/sgl-product-079.webp",
      "/products/optimized/sgl-product-080.webp"
    ],
    "description": "A compact drawcord SGL bag designed to mount at the bicycle handlebar, with side mesh pockets for small essentials.",
    "details": [
      "Handlebar-mounted bag",
      "Drawcord closure",
      "Side mesh pockets"
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
      "/products/chrissy-ti-street.webp",
      "/products/optimized/sgl-product-081.webp"
    ],
    "description": "Chrissy Ti is an original SeaGull Labs bicycle model built around a titanium alloy frame. Contact SGL for current configuration, sizing and availability.",
    "details": [
      "Titanium alloy frame",
      "Original SGL bicycle model",
      "Options vary by size and finish"
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
    "title": "SGL Bicycle Reflector",
    "category": "Accessories",
    "price": 13.0,
    "priceLabel": "13",
    "badge": "Character Gear",
    "images": [
      "/products/optimized/sgl-product-082.webp",
      "/products/optimized/sgl-product-083.webp",
      "/products/optimized/sgl-product-084.webp",
      "/products/optimized/sgl-product-085.webp"
    ],
    "description": "An illustrated SGL bicycle reflector designed as a hanging accessory for bags and everyday carry.",
    "details": [
      "SGL cycling character artwork"
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

  return !product.hidden && hasImage && hasPrice;
}

export const storefrontProducts = products.filter(isProductReadyForStorefront);

export const categories = Array.from(
  new Set(storefrontProducts.map((product) => product.category))
);

export function getProduct(slug: string) {
  return storefrontProducts.find((product) => product.slug === slug);
}

export function getProductsByCategory(category: string) {
  const items = storefrontProducts.filter((product) => product.category === category);
  if (category === "Bikes / Frames") {
    return [
      ...items.filter(product => product.slug === "chrissy1"),
      ...items.filter(product => product.slug !== "chrissy1")
    ];
  }
  if (category !== "Bags & Carry") return items;
  const last = ["seat-bag", "bike-cover", "reveal-shoe-sack", "sportglassea-case"];
  return [
    ...items.filter(product => !last.includes(product.slug)),
    ...last.flatMap(slug => items.filter(product => product.slug === slug))
  ];
}
