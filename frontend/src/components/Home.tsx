import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Product } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

function getLevenshteinDistance(a: string, b: string): number {
  const tmp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) tmp[i][0] = i;
  for (let j = 0; j <= b.length; j++) tmp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        tmp[i][j] = tmp[i - 1][j - 1];
      } else {
        tmp[i][j] = Math.min(
          tmp[i - 1][j] + 1,
          tmp[i][j - 1] + 1,
          tmp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return tmp[a.length][b.length];
}

function isSubsequence(text: string, query: string): boolean {
  if (!query) return true;
  let qIdx = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === query[qIdx]) {
      qIdx++;
      if (qIdx === query.length) return true;
    }
  }
  return false;
}

function isFuzzyMatch(target: string, query: string): boolean {
  const term = query.toLowerCase().trim();
  if (!term) return true;
  
  const text = target.toLowerCase();
  
  // 1. Direct substring match
  if (text.includes(term)) return true;
  
  // 2. Subsequence match (for missing characters)
  if (isSubsequence(text, term)) return true;
  
  // 3. Word-level Levenshtein match (for typos)
  const targetWords = text.split(/\s+/).filter(Boolean);
  const queryWords = term.split(/\s+/).filter(Boolean);
  
  return queryWords.every(qw => {
    return targetWords.some(tw => {
      if (tw.includes(qw)) return true;
      const distance = getLevenshteinDistance(qw, tw);
      const threshold = qw.length <= 3 ? 1 : qw.length <= 6 ? 2 : 3;
      return distance <= threshold;
    });
  });
}

function productMatchesCategoryAndSub(
  p: Product,
  activeCategory: string,
  activeSub: string
): boolean {
  const normCategory = activeCategory.trim();
  const normSub = activeSub.trim().toLowerCase();

  // Determine if product is a legacy seeded product
  const isLegacy = ['t-shirts', 'outerwear', 'sweatshirts', 'pants', 'activewear'].includes(p.category.toLowerCase()) || 
                   (p.category === 'Accessories' && !p.subCategory);

  // 1. Check Category Match
  let matchesCategory = false;
  if (normCategory === 'All') {
    matchesCategory = true;
  } else if (normCategory === 'Men' || normCategory === 'Women' || normCategory === 'Kids') {
    if (p.category === normCategory) {
      matchesCategory = true;
    } else if (isLegacy) {
      matchesCategory = true;
    }
  } else if (normCategory === 'Accessories') {
    matchesCategory = p.category === 'Accessories' || (p.subCategory || '').toLowerCase().trim() === 'accessories';
  } else if (normCategory === 'Footwear') {
    const pSub = (p.subCategory || '').toLowerCase().trim();
    const isFootwearSub = ['sneakers', 'formal', 'casual', 'others', 'footwear'].includes(pSub);
    matchesCategory = p.category === 'Footwear' || isFootwearSub;
  } else {
    matchesCategory = p.category === normCategory;
  }

  if (!matchesCategory) return false;

  // 2. Check Subcategory Match
  if (!activeSub) return true;

  const productSub = (p.subCategory || '').toLowerCase().trim();

  // If the product is not legacy and has a specific subCategory, check direct match first
  if (!isLegacy && p.subCategory) {
    const matchesDirectly = 
      productSub === normSub ||
      (normSub === 'shirts' && productSub === 'shirts & tops') ||
      (normSub === 'pants' && productSub === 'pants & jeans') ||
      (normSub === 'formal' && productSub === 'formal shoes') ||
      (normSub === 'casual' && productSub === 'casual shoes') ||
      (productSub !== '' && (productSub.includes(normSub) || normSub.includes(productSub)));
      
    if (matchesDirectly) return true;
  }

  // Fallback / legacy matching
  const nameLower = p.name.toLowerCase();

  if (normSub === 'shirts' || normSub === 'shirts & tops') {
    const isShirtCat = ['t-shirts', 'outerwear', 'sweatshirts', 'activewear'].includes(p.category.toLowerCase());
    const isShirtName = nameLower.includes('shirt') || nameLower.includes('tee') || nameLower.includes('hoodie') || nameLower.includes('sweater') || nameLower.includes('jacket');
    return isShirtCat || isShirtName;
  }

  if (normSub === 'pants' || normSub === 'pants & jeans') {
    const isPantsCat = p.category.toLowerCase() === 'pants';
    const isPantsName = nameLower.includes('pant') || nameLower.includes('denim') || nameLower.includes('shorts') || nameLower.includes('chinos') || nameLower.includes('trouser');
    return isPantsCat || isPantsName;
  }

  if (normSub === 'accessories') {
    const isAccCat = p.category.toLowerCase() === 'accessories';
    const isAccName = nameLower.includes('bag') || nameLower.includes('cap') || nameLower.includes('socks') || nameLower.includes('backpack') || nameLower.includes('hat');
    return isAccCat || isAccName;
  }

  if (normSub === 'bags') {
    return nameLower.includes('bag') || nameLower.includes('backpack');
  }

  if (normSub === 'caps') {
    return nameLower.includes('cap') || nameLower.includes('hat');
  }

  if (normSub === 'socks') {
    return nameLower.includes('socks');
  }

  if (normSub === 'sneakers') {
    return nameLower.includes('sneaker') || nameLower.includes('shoe') || nameLower.includes('run');
  }

  if (normSub === 'formal') {
    return nameLower.includes('formal') || nameLower.includes('oxford') || nameLower.includes('derby');
  }

  if (normSub === 'casual') {
    return nameLower.includes('casual') || nameLower.includes('loafer') || nameLower.includes('sandal') || nameLower.includes('slip') || nameLower.includes('boot');
  }

  if (normSub === 'others') {
    return true;
  }

  return false;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') || 'All';
  const subCategory = searchParams.get('sub') || '';

  const setCategory = (newCat: string) => {
    if (newCat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', newCat);
    }
    searchParams.delete('sub');
    setSearchParams(searchParams);
  };

  useEffect(() => {
    api.getProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch products:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setSearchTerm('');
  }, [category, subCategory]);

  const categories = ['All', 'Men', 'Women', 'Kids', 'Accessories', 'Footwear'];

  const filteredProducts = products.filter(p => {
    // 1 & 2. Category & Subcategory match
    const matchesCatAndSub = productMatchesCategoryAndSub(p, category, subCategory);

    // 3. Search term match
    const term = searchTerm.toLowerCase().trim();
    let matchesSearch = true;
    if (term) {
      const categoriesList = ['accessories', 'footwear', 'men', 'women', 'kids', 'pants', 't-shirts', 'sweatshirts', 'outerwear', 'activewear'];
      const matchedGlobalCategory = categoriesList.find(cat => isFuzzyMatch(cat, term));

      const matchesSearchCategory = 
        p.category.toLowerCase().includes(term) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(term)) ||
        (!!matchedGlobalCategory && p.category.toLowerCase().includes(matchedGlobalCategory));

      matchesSearch = 
        isFuzzyMatch(p.name, term) ||
        isFuzzyMatch(p.description, term) ||
        matchesSearchCategory;
    }

    return matchesCatAndSub && matchesSearch;
  });


  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-slate-900 rounded-2xl p-8 sm:p-16 text-center text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Discover Your Aura</h1>
          <p className="text-lg text-slate-300">Premium quality clothing designed for modern living.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${category === c && !subCategory ? 'bg-black text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
            >
              {c}
            </button>
          ))}
          {subCategory && (
            <span className="inline-flex items-center bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap">
              {subCategory}
              <button 
                onClick={() => {
                  searchParams.delete('sub');
                  setSearchParams(searchParams);
                }}
                className="ml-1.5 hover:text-indigo-900 font-bold"
              >
                &times;
              </button>
            </span>
          )}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col space-y-4">
              <div className="bg-slate-200 aspect-[3/4] rounded-xl"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredProducts.map(product => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={product.id}
              className="group flex flex-col"
            >
              <Link to={`/product/${product.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-xl bg-slate-100">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="bg-black text-white px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full">Out of Stock</span>
                  </div>
                )}
              </Link>
              <div className="mt-4 flex flex-col items-start gap-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{product.category}</p>
                <Link to={`/product/${product.id}`} className="text-sm font-semibold text-slate-900 group-hover:text-black line-clamp-1">{product.name}</Link>
                <p className="text-sm font-medium text-slate-900">{formatCurrency(product.price, product.currency)}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-500">No products found.</p>
        </div>
      )}
    </div>
  );
}
