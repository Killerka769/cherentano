'use client';

import { motion } from 'framer-motion';
import Hero from '@/app/components/ui/Hero/Hero';
import Features from '@/app/components/ui/Features/Features';
import PopularDishes from '@/app/components/ui/PopularDishes/PopularDishes';
import RestaurantGallery from '@/app/components/ui/RestaurantGallery/RestaurantGallery';
import Reviews from './components/ui/Reviews/Reviews';
import RecentlyViewed from './components/ui/RecentlyViewed/RecentlyViewed';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Hero />
      {/* <RestaurantGallery /> */}
      <Features />
      <Reviews />
      <PopularDishes />
      <RecentlyViewed />
    </motion.div>
  );
}