import { HeroHeader } from '@/components/header'
import ProductDetailsWrapper from '@/components/product-details-wrapper'
import { extractProductIdFromSlug } from '@/lib/slug-utils'
import { notFound } from 'next/navigation'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  
  console.log('Product page slug:', slug)
  
  // Extract product ID from slug
  const productId = extractProductIdFromSlug(slug)
  
  console.log('Extracted product ID:', productId)
  
  if (!productId) {
    console.log('No product ID found in slug, showing 404')
    notFound()
  }

  return (
    <>
      <HeroHeader />
      <ProductDetailsWrapper productId={productId} slug={slug} />
    </>
  )
}
