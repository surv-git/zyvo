import BestSellers from "@/components/best-sellers";
import CategoryCarousel from "@/components/category-carousel";
import Deals from "@/components/deals";
import FeaturedProducts from "@/components/featured-products";
import FooterSection from "@/components/footer-one";
import HeroSection from "@/components/hero-section-one";
import LatestProducts from "@/components/latest-products";
import RecommendedProducts from "@/components/recommended-products";
import { EmblaOptionsType } from 'embla-carousel'

export default function Home() {

  const OPTIONS: EmblaOptionsType = { align: 'start' }

  return (
    <>
    <HeroSection />    
    <CategoryCarousel options={OPTIONS} />
    <FeaturedProducts />
    <Deals />
    <BestSellers />
    <LatestProducts />
    <RecommendedProducts />
    <FooterSection />
    </>
  );
}