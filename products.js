/**
 * RADICAL — Product Data
 * Single source of truth for all product data.
 * To swap in real images: update images.primary / images.hover and set placeholder: false.
 * No other file needs to change.
 */

window.RADICAL_PRODUCTS = (function () {
  'use strict';

  /* ── Product catalogue ───────────────────────────────────────── */
  const products = [
    {
      id:          'RAD-002',
      dbId:        1,
      url:         '/product?id=RAD-002',
      name:        'CHAINLINK RING - BLACK',
      subtitle:    'Matte Black Steel, Industrial Link',
      price:       '841',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'chainlink-ring-black',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/chainlink-ring/black/front.webp',
        hover:   'assets/products/chainlink-ring/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-003',
      dbId:        2,
      url:         '/product?id=RAD-003',
      name:        'CHAINLINK RING - SILVER',
      subtitle:    'Brushed Surgical Steel, Industrial Link',
      price:       '841',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Silver plated\nColor : Oxydised Silver',
      currency:    '₹',
      sku:         'chainlink-ring-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/chainlink-ring/silver/front.webp',
        hover:   'assets/products/chainlink-ring/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-004',
      dbId:        3,
      url:         '/product-pendant?id=RAD-004',
      name:        'COMPASS CHAIN - BLACK',
      subtitle:    'Matte Black Steel, Engraved Motif',
      price:       '4,624',
      comparePrice: '11,499',
      
      details:     'White rodium plated setting with round  black ceramic stones necklace\nColor : Silver, Black',
      currency:    '₹',
      sku:         'compass-chain-black',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/compass-cuff/black/front.webp',
        hover:   'assets/products/compass-cuff/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-005',
      dbId:        4,
      url:         '/product-pendant?id=RAD-005',
      name:        'COMPASS CHAIN - SILVER',
      subtitle:    'Brushed Steel, Engraved Motif',
      price:       '4,624',
      comparePrice: '11,499',
      
      details:     'Solitare necklace set in white rodium.\nMaterial : Brass, Silver plated, AAA grade CZ\nColor : Silver',
      currency:    '₹',
      sku:         'compass-chain-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/compass-cuff/silver/front.webp',
        hover:   'assets/products/compass-cuff/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-006',
      dbId:        5,
      url:         '/product-bracelet?id=RAD-006',
      name:        'CROWN TENNIS BRACELET - BLACK ON BLACK',
      subtitle:    'Black Steel, Midnight Onyx Gems',
      price:       '4,624',
      comparePrice: '11,499',
      
      details:     'Black rodium plated setting with round  black ceramic stones.\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'crown-tennis-bracelet-black-on-black',
      category:    'bracelets',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/crown-tennis-bracelet/black-on-black/front.webp',
        hover:   'assets/products/crown-tennis-bracelet/black-on-black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-007',
      dbId:        6,
      url:         '/product-bracelet?id=RAD-007',
      name:        'CROWN TENNIS BRACELET - BLACK ON SILVER',
      subtitle:    'Brushed Steel, Black Onyx Gems',
      price:       '4,624',
      comparePrice: '11,499',
      
      details:     'White rodium plated setting with round  black ceramic stones\nColor : Silver, Black',
      currency:    '₹',
      sku:         'crown-tennis-bracelet-black-on-silver',
      category:    'bracelets',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/crown-tennis-bracelet/black-on-silver/front.webp',
        hover:   'assets/products/crown-tennis-bracelet/black-on-silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-008',
      dbId:        7,
      url:         '/product-bracelet?id=RAD-008',
      name:        'CROWN TENNIS BRACELET - DIAMOND ON SILVER',
      subtitle:    'Brushed Steel, Brilliant White Stones',
      price:       '4,624',
      comparePrice: '11,499',
      
      details:     'Solitare bracelet set in white rodium.\nMaterial : Brass, Silver plated, AAA grade CZ\nColor : Silver',
      currency:    '₹',
      sku:         'crown-tennis-bracelet-diamond-on-silver',
      category:    'bracelets',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/crown-tennis-bracelet/diamond-on-silver/front.webp',
        hover:   'assets/products/crown-tennis-bracelet/diamond-on-silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-009',
      dbId:        8,
      url:         '/product?id=RAD-009',
      name:        'DIAMOND VAULT RING - BLACK ON SILVER',
      subtitle:    'Surgical Steel, Vault Inset Onyx',
      price:       '1,429',
      comparePrice: '3,499',
      
      details:     'Pave Set CZ Wide Band Ring\nWhite rodium plated ring with round black ceramic stones',
      currency:    '₹',
      sku:         'diamond-vault-ring-black-on-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/diamond-vault-ring/black-on-silver/front.webp',
        hover:   'assets/products/diamond-vault-ring/black-on-silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-010',
      dbId:        9,
      url:         '/product?id=RAD-010',
      name:        'DIAMOND VAULT RING - DIAMOND ON BLACK',
      subtitle:    'Black Steel, Vault Inset White Gems',
      price:       '1,429',
      comparePrice: '3,499',
      
      details:     'Pave Set CZ Wide Band Ring\nMaterial : Brass, Black Gold, Cubic Zirconia\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'diamond-vault-ring-diamond-on-black',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/diamond-vault-ring/diamond-on-black/front.webp',
        hover:   'assets/products/diamond-vault-ring/diamond-on-black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-011',
      dbId:        10,
      url:         '/product?id=RAD-011',
      name:        'DIAMOND VAULT RING - DIAMOND ON SILVER',
      subtitle:    'Brushed Steel, Vault Inset White Gems',
      price:       '1,429',
      comparePrice: '3,499',
      
      details:     'Pave Set CZ Wide Band Ring\nWhite rodium plated ring with high grade cubic zirco',
      currency:    '₹',
      sku:         'diamond-vault-ring-diamond-on-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/diamond-vault-ring/diamond-on-silver/front.webp',
        hover:   'assets/products/diamond-vault-ring/diamond-on-silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-012',
      dbId:        11,
      url:         '/product?id=RAD-012',
      name:        'ECLIPSE RING - BLACK',
      subtitle:    'Matte Black, Center Eclipse Groove',
      price:       '946',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'eclipse-ring-black',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/eclipse-ring/black/front.webp',
        hover:   'assets/products/eclipse-ring/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-013',
      dbId:        12,
      url:         '/product?id=RAD-013',
      name:        'ECLIPSE RING - SILVER',
      subtitle:    'Polished Steel, Center Eclipse Groove',
      price:       '946',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Silver plated\nColor : Oxydised Silver',
      currency:    '₹',
      sku:         'eclipse-ring-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/eclipse-ring/silver/front.webp',
        hover:   'assets/products/eclipse-ring/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-014',
      dbId:        13,
      url:         '/product?id=RAD-014',
      name:        'ECLIPSE SIGNET RING - GOLD',
      subtitle:    'Gold-Plated, Eclipse Face Carving',
      price:       '1,009',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Gold plated\nColor : Gold',
      currency:    '₹',
      sku:         'eclipse-signet-ring-gold',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/eclipse-signet-ring/gold/front.webp',
        hover:   'assets/products/eclipse-signet-ring/gold/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-015',
      dbId:        14,
      url:         '/product?id=RAD-015',
      name:        'ECLIPSE SIGNET RING - SILVER',
      subtitle:    'Brushed Steel, Eclipse Face Carving',
      price:       '1,009',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated\nColor : Silver',
      currency:    '₹',
      sku:         'eclipse-signet-ring-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/eclipse-signet-ring/silver/front.webp',
        hover:   'assets/products/eclipse-signet-ring/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-016',
      dbId:        15,
      url:         '/product?id=RAD-016',
      name:        'ETERNAL KNOT RING - BLACK',
      subtitle:    'Matte Black, Celtic Knot Band',
      price:       '925',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'eternal-knot-ring-black',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/eternal-knot-ring/black/front.webp',
        hover:   'assets/products/eternal-knot-ring/black/closeup.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-017',
      dbId:        16,
      url:         '/product?id=RAD-017',
      name:        'ETERNAL KNOT RING - SILVER',
      subtitle:    'Brushed Steel, Celtic Knot Band',
      price:       '925',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Silver plated\nColor : Silver',
      currency:    '₹',
      sku:         'eternal-knot-ring-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/eternal-knot-ring/silver/front.webp',
        hover:   'assets/products/eternal-knot-ring/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-018',
      dbId:        17,
      url:         '/product-pendant?id=RAD-018',
      name:        'GUARDIAN PENDANT - BLACK ON BLACK',
      subtitle:    'Black Steel Shield, Onyx Cabochon',
      price:       '1,051',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Black Gold, Black Enamel\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'guardian-pendant-black-on-black',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/guardian-pendant/black-on-black/front.webp',
        hover:   'assets/products/guardian-pendant/black-on-black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-019',
      dbId:        18,
      url:         '/product-pendant?id=RAD-019',
      name:        'GUARDIAN PENDANT - BLACK ON SILVER',
      subtitle:    'Steel Shield, Onyx Cabochon',
      price:       '1,051',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, Black Enamel\nColor : Silver',
      currency:    '₹',
      sku:         'guardian-pendant-black-on-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/guardian-pendant/black-on-silver/front.webp',
        hover:   'assets/products/guardian-pendant/black-on-silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-020',
      dbId:        19,
      url:         '/product-pendant?id=RAD-020',
      name:        'GUARDIAN PENDANT - DIAMOND ON SILVER',
      subtitle:    'Steel Shield, White Stone Inset',
      price:       '1,051',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
      currency:    '₹',
      sku:         'guardian-pendant-diamond-on-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/guardian-pendant/diamond-on-silver/front.webp',
        hover:   'assets/products/guardian-pendant/diamond-on-silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-021',
      dbId:        20,
      url:         '/product?id=RAD-021',
      name:        'IMPERIAL EYE RING - BLACK GEM',
      subtitle:    'Engraved Eye Signet, Black Onyx',
      price:       '946',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, Black Onyx\nColor : Silver',
      currency:    '₹',
      sku:         'imperial-eye-ring-black-gem',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/imperial-eye-ring/black-gem/front.webp',
        hover:   'assets/products/imperial-eye-ring/black-gem/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-022',
      dbId:        21,
      url:         '/product?id=RAD-022',
      name:        'IMPERIAL EYE RING - DIAMOND GEM',
      subtitle:    'Engraved Eye Signet, White Gem',
      price:       '946',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
      currency:    '₹',
      sku:         'imperial-eye-ring-diamond-gem',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/imperial-eye-ring/diamond-gem/front.webp',
        hover:   'assets/products/imperial-eye-ring/diamond-gem/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-023',
      dbId:        22,
      url:         '/product-pendant?id=RAD-023',
      name:        'INFINITE LOOP PENDANT - BLACK',
      subtitle:    'Matte Black, Twist Möbius Ribbon',
      price:       '1,240',
      comparePrice: '2,999',
      
      details:     'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'infinite-loop-pendant-black',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/infinite-loop-pendant/black/front.webp',
        hover:   'assets/products/infinite-loop-pendant/black/closeup.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-024',
      dbId:        23,
      url:         '/product-pendant?id=RAD-024',
      name:        'INFINITE LOOP PENDANT - SILVER',
      subtitle:    'Brushed Steel, Twist Möbius Ribbon',
      price:       '1,240',
      comparePrice: '2,999',
      
      details:     'Material : Brass, Silver plated\nColor : Silver',
      currency:    '₹',
      sku:         'infinite-loop-pendant-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/infinite-loop-pendant/silver/front.webp',
        hover:   'assets/products/infinite-loop-pendant/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-025',
      dbId:        24,
      url:         '/product-pendant?id=RAD-025',
      name:        'LEGACY TAG PENDANT - BLACK WITH DIAMOND',
      subtitle:    'Black Military Tag, Inset White Gem',
      price:       '1,051',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Black Gold, AAA grade CZ\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'legacy-tag-pendant-black-with-diamond',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/legacy-tag-pendant/black-with-diamond/front.webp',
        hover:   'assets/products/legacy-tag-pendant/black-with-diamond/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-026',
      dbId:        25,
      url:         '/product-pendant?id=RAD-026',
      name:        'LEGACY TAG PENDANT - SILVER WITH BLACK GEMS',
      subtitle:    'Steel Dog Tag, Double Black Onyx',
      price:       '1,051',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, Black ceramic stones\nColor : Silver',
      currency:    '₹',
      sku:         'legacy-tag-pendant-silver-with-black-gems',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/legacy-tag-pendant/silver-with-black-gems/front.webp',
        hover:   'assets/products/legacy-tag-pendant/silver-with-black-gems/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-027',
      dbId:        26,
      url:         '/product-pendant?id=RAD-027',
      name:        'LEGACY TAG PENDANT - SILVER WITH DIAMOND',
      subtitle:    'Steel Dog Tag, Central White Gem',
      price:       '1,051',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
      currency:    '₹',
      sku:         'legacy-tag-pendant-silver-with-diamond',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/legacy-tag-pendant/silver-with-diamond/front.webp',
        hover:   'assets/products/legacy-tag-pendant/silver-with-diamond/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-028',
      dbId:        27,
      url:         '/product-pendant?id=RAD-028',
      name:        'MONUMENT PENDANT',
      subtitle:    'Surgical Steel Brutalist Column',
      price:       '1,429',
      comparePrice: '3,499',
      
      details:     'Material : Brass, Silver plated\nColor : Silver',
      currency:    '₹',
      sku:         'monument-pendant',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/monument-pendant/front.webp',
        hover:   'assets/products/monument-pendant/closeup.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-029',
      dbId:        28,
      url:         '/product-pendant?id=RAD-029',
      name:        'NORTHSTAR PENDANT - BLACK',
      subtitle:    'Matte Black, Compass Star Design',
      price:       '1,009',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Black Gold, AAA grade CZ\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'northstar-pendant-black',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/northstar-pendant/black/front.webp',
        hover:   'assets/products/northstar-pendant/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-030',
      dbId:        29,
      url:         '/product-pendant?id=RAD-030',
      name:        'NORTHSTAR PENDANT - SILVER',
      subtitle:    'Brushed Steel, Compass Star Design',
      price:       '1,009',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
      currency:    '₹',
      sku:         'northstar-pendant-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/northstar-pendant/silver/front.webp',
        hover:   'assets/products/northstar-pendant/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-031',
      dbId:        30,
      url:         '/product-pendant?id=RAD-031',
      name:        'OBSIDIAN GRID PENDANT - GOLD',
      subtitle:    'Gold Steel Frame, Obsidian Grid Tile',
      price:       '1,156',
      comparePrice: '2,999',
      
      details:     'Material : Brass, Gold plated, Black Enamel.\nColor : Gold',
      currency:    '₹',
      sku:         'obsidian-grid-pendant-gold',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/obsidian-grid-pendant/gold/front.webp',
        hover:   'assets/products/obsidian-grid-pendant/gold/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-032',
      dbId:        31,
      url:         '/product-pendant?id=RAD-032',
      name:        'OBSIDIAN GRID PENDANT - SILVER',
      subtitle:    'Brushed Steel, Obsidian Grid Tile',
      price:       '1,156',
      comparePrice: '2,999',
      
      details:     'Material : Brass, Silver plated, Black Enamel.\nColor : Silver',
      currency:    '₹',
      sku:         'obsidian-grid-pendant-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/obsidian-grid-pendant/silver/front.webp',
        hover:   'assets/products/obsidian-grid-pendant/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-033',
      dbId:        32,
      url:         '/product?id=RAD-033',
      name:        'OBSIDIAN MONARCH RING',
      subtitle:    'Heavy Steel, Flat Obsidian Slab',
      price:       '1,366',
      comparePrice: '2,999',
      
      details:     'Material : Brass, Silver plated, Black Obsidian\nColor : Silver',
      currency:    '₹',
      sku:         'obsidian-monarch-ring',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/obsidian-monarch-ring/front.webp',
        hover:   'assets/products/obsidian-monarch-ring/closeup.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-034',
      dbId:        33,
      url:         '/product-pendant?id=RAD-034',
      name:        'ONYX CORE PENDANT - BLACK',
      subtitle:    'Black Steel Frame, Onyx Cylinder Core',
      price:       '1,114',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'onyx-core-pendant-black',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/onyx-core-pendant/black/front.webp',
        hover:   'assets/products/onyx-core-pendant/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-035',
      dbId:        34,
      url:         '/product-pendant?id=RAD-035',
      name:        'ONYX CORE PENDANT - SILVER',
      subtitle:    'Brushed Steel Frame, Onyx Cylinder Core',
      price:       '1,114',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, Black Enamel.\nColor : Oxydised Silver',
      currency:    '₹',
      sku:         'onyx-core-pendant-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/onyx-core-pendant/silver/front.webp',
        hover:   'assets/products/onyx-core-pendant/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-036',
      dbId:        35,
      url:         '/product-pendant?id=RAD-036',
      name:        'PATH FINDER PENDANT - BLACK',
      subtitle:    'Matte Black, Geometric Arrow Head',
      price:       '1,009',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'path-finder-pendant-black',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/path-finder-pendant/black/front.webp',
        hover:   'assets/products/path-finder-pendant/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-037',
      dbId:        36,
      url:         '/product-pendant?id=RAD-037',
      name:        'PATH FINDER PENDANT - GOLD',
      subtitle:    '18K Gold Plated, Geometric Arrow Head',
      price:       '1,009',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Gold plated\nColor : Gold',
      currency:    '₹',
      sku:         'path-finder-pendant-gold',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/path-finder-pendant/gold/front.webp',
        hover:   'assets/products/path-finder-pendant/gold/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-038',
      dbId:        37,
      url:         '/product-pendant?id=RAD-038',
      name:        'PATH FINDER PENDANT - SILVER',
      subtitle:    'Brushed Steel, Geometric Arrow Head',
      price:       '1,009',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated\nColor : Silver',
      currency:    '₹',
      sku:         'path-finder-pendant-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/path-finder-pendant/silver/front.webp',
        hover:   'assets/products/path-finder-pendant/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-039',
      dbId:        38,
      url:         '/product?id=RAD-039',
      name:        'RUNE SHIELD RING - BLACK',
      subtitle:    'Matte Black Steel, Protective Runes',
      price:       '841',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'rune-shield-ring-black',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/rune-shield-ring/black/front.webp',
        hover:   'assets/products/rune-shield-ring/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-040',
      dbId:        39,
      url:         '/product?id=RAD-040',
      name:        'RUNE SHIELD RING - SILVER',
      subtitle:    'Surgical Steel, Protective Runes',
      price:       '841',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Silver plated\nColor : Silver',
      currency:    '₹',
      sku:         'rune-shield-ring-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/rune-shield-ring/silver/front.webp',
        hover:   'assets/products/rune-shield-ring/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-041',
      dbId:        40,
      url:         '/product?id=RAD-041',
      name:        'SERPENT ASCEND RING - BLACK',
      subtitle:    'Matte Black, Coiled Serpent Motif',
      price:       '946',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Black Gold\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'serpent-ascend-ring-black',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/serpent-ascend-ring/black/front.webp',
        hover:   'assets/products/serpent-ascend-ring/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-042',
      dbId:        41,
      url:         '/product?id=RAD-042',
      name:        'SERPENT ASCEND RING - SILVER',
      subtitle:    'Brushed Steel, Coiled Serpent Motif',
      price:       '946',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Silver plated\nColor : Oxydised Silver',
      currency:    '₹',
      sku:         'serpent-ascend-ring-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/serpent-ascend-ring/silver/front.webp',
        hover:   'assets/products/serpent-ascend-ring/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-043',
      dbId:        42,
      url:         '/product-pendant?id=RAD-043',
      name:        'SPEAR PENDANT - BLACK',
      subtitle:    'Matte Black, Brutalist Spear Tip',
      price:       '1,156',
      comparePrice: '2,999',
      
      details:     'Material : Brass, Black Gold, Black Onyx.\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'spear-pendant-black',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/spear-pendant/black/front.webp',
        hover:   'assets/products/spear-pendant/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-044',
      dbId:        43,
      url:         '/product-pendant?id=RAD-044',
      name:        'SPEAR PENDANT - SILVER',
      subtitle:    'Brushed Steel, Brutalist Spear Tip',
      price:       '1,156',
      comparePrice: '2,999',
      
      details:     'Material : Brass, Silver plated, AAA grade CZ\nColor : Silver',
      currency:    '₹',
      sku:         'spear-pendant-silver',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/spear-pendant/silver/front.webp',
        hover:   'assets/products/spear-pendant/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-045',
      dbId:        44,
      url:         '/product-pendant?id=RAD-045',
      name:        'SPEAR PENDANT - SILVER WITH BLACK STONE',
      subtitle:    'Brushed Steel, Spear with Onyx Stone',
      price:       '1,156',
      comparePrice: '2,999',
      
      details:     'Material : Brass, Silver plated, Black Onyx.\nColor : Silver',
      currency:    '₹',
      sku:         'spear-pendant-silver-with-black-stone',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/spear-pendant/silver-with-black-stone/front.webp',
        hover:   'assets/products/spear-pendant/silver-with-black-stone/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-046',
      dbId:        45,
      url:         '/product-pendant?id=RAD-046',
      name:        'TENNIS BLACK STONE CHAIN',
      subtitle:    'Continuous Collar Set with Midnight Onyx',
      price:       '1,051',
      comparePrice: '2,499',
      
      details:     'Material : Brass, Silver plated, Black Onyx.\nColor : Oxydised Silver',
      currency:    '₹',
      sku:         'tennis-black-stone-chain',
      category:    'pendants',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/tennis-black-stone-chain/front.webp',
        hover:   'assets/products/tennis-black-stone-chain/closeup.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-047',
      dbId:        46,
      url:         '/product?id=RAD-047',
      name:        'WORLD TREE RING - BLACK',
      subtitle:    'Matte Black, Yggdrasil Engraving',
      price:       '946',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Black Gold, Black Onyx.\nColor : Black Gold / Gun metal',
      currency:    '₹',
      sku:         'world-tree-ring-black',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/world-tree-ring/black/front.webp',
        hover:   'assets/products/world-tree-ring/black/front.webp',
      },
      placeholder: false,
      available:   true,
    },
    {
      id:          'RAD-048',
      dbId:        47,
      url:         '/product?id=RAD-048',
      name:        'WORLD TREE RING - SILVER',
      subtitle:    'Brushed Steel, Yggdrasil Engraving',
      price:       '946',
      comparePrice: '1,999',
      
      details:     'Material : Brass, Silver plated\nColor : Oxydised Silver',
      currency:    '₹',
      sku:         'world-tree-ring-silver',
      category:    'rings',
      collection:  'collection-i',
      images: {
        primary: 'assets/products/world-tree-ring/silver/front.webp',
        hover:   'assets/products/world-tree-ring/silver/front.webp',
      },
      placeholder: false,
      available:   true,
    }
  ];

  const collections = [
    {
      id:       'collection-i',
      name:     'COLLECTION I',
      subtitle: 'THE FIRST DISCIPLINE',
      year:     'MMXXV',
    },
  ];

  /* ── Internal builders ───────────────────────────────────────── */
  function _placeholder() {
    return '<div class="product-card__placeholder">'
      + '<div class="product-card__placeholder-inner">'
      + '<span class="product-card__placeholder-label">RADICAL</span>'
      + '<span class="product-card__placeholder-sub">Coming Soon</span>'
      + '</div>'
      + '</div>';
  }

  function _buildCard(product, index) {
    var imageMarkup;

    if (product.placeholder) {
      imageMarkup = _placeholder();
    } else {
      var loadPrimary = index < 2 ? 'eager' : 'lazy';
      imageMarkup =
        '<img class="img-primary"'
        + ' src="' + product.images.primary + '"'
        + ' alt="' + product.name + '"'
        + ' loading="' + loadPrimary + '" width="800" height="1000" />'
        + '<img class="img-hover"'
        + ' src="' + product.images.hover + '"'
        + ' alt="' + product.name + ' — detail"'
        + ' loading="lazy" width="800" height="1000" />';
    }

    var priceMarkup = '';
    if (product.comparePrice) {
      priceMarkup = '<span class="price-original">' + product.currency + product.comparePrice + '</span>'
        + '<span class="price-discounted">' + product.currency + product.price + '</span>';
    } else {
      priceMarkup = '<span class="price-discounted">' + product.currency + product.price + '</span>';
    }

    return '<article class="product-card" data-product-id="' + product.id + '" data-category="' + product.category + '">'
      + '<a class="product-card__link" href="' + product.url + '">'
      + '<div class="product-card__image-wrap">'
      + imageMarkup
      + '<div class="product-card__hover-cta">View Piece</div>'
      + '</div>'
      + '<div class="product-card__info">'
      + '<span class="product-card__name">' + product.name + '</span>'
      + '<span class="product-card__price">' + priceMarkup + '</span>'
      + '</div>'
      + '</a>'
      + '</article>';
  }

  function getBaseProducts() {
    var baseMap = {};
    for (var idx = 0; idx < products.length; idx++) {
      var p = products[idx];
      var parts = p.name.split(' - ');
      var baseName = parts[0].trim();
      if (!baseMap[baseName]) {
        baseMap[baseName] = {
          id:          p.id,
          dbId:        p.dbId,
          url:         p.url,
          name:        baseName,
          subtitle:    p.subtitle,
          price:       p.price,
          comparePrice: p.comparePrice,
          details:     'Material : Brass, Silver plated\nColor : Silver',
          currency:    p.currency,
          sku:         p.sku,
          category:    p.category,
          collection:  p.collection,
          images: {
            primary: p.images.primary,
            hover:   p.images.hover
          },
          placeholder: p.placeholder,
          available:   p.available,
          variants:    []
        };
      }
      
      var colorLabel = 'Standard';
      if (parts.length > 1) {
        colorLabel = parts[1].trim();
      }
      
      baseMap[baseName].variants.push({
        id:          p.id,
        dbId:        p.dbId,
        color:       colorLabel,
        price:       p.price,
        comparePrice: p.comparePrice,
        images:      p.images,
        url:         p.url,
        sku:         p.sku,
        details:     p.details
      });
    }
    
    var result = [];
    for (var key in baseMap) {
      if (baseMap.hasOwnProperty(key)) {
        result.push(baseMap[key]);
      }
    }
    return result;
  }

  /* ── Public API ──────────────────────────────────────────────── */

  /**
   * Render product cards into a container element.
   * @param {Element} containerEl  — the grid element to populate
   * @param {string}  [category]   — optional category filter (e.g. 'rings', 'bracelets')
   * @param {number}  [limit]      — optional max number of cards (e.g., 4 for featured)
   */
  function renderGrid(containerEl, category, limit) {
    if (!containerEl) return;
    var baseList = getBaseProducts();
    var filtered = baseList;
    var filterCat = typeof category === 'string' ? category : 'all';
    var maxLimit = typeof category === 'number' ? category : limit;
    
    if (typeof category === 'string' && category !== 'all') {
      filtered = baseList.filter(function (p) { return p.category === filterCat; });
    }
    
    var items = typeof maxLimit === 'number' ? filtered.slice(0, maxLimit) : filtered;
    containerEl.innerHTML = items.map(function (p, i) { return _buildCard(p, i); }).join('');
  }

  /** Update every .product-count element on the page. */
  function updateProductCount() {
    var count = String(getBaseProducts().length).padStart(2, '0') + ' Pieces';
    document.querySelectorAll('.product-count').forEach(function (el) {
      el.textContent = count;
    });
  }

  return {
    products:           products,
    collections:        collections,
    renderGrid:         renderGrid,
    updateProductCount: updateProductCount,
    getBaseProducts:    getBaseProducts,
  };
})();
