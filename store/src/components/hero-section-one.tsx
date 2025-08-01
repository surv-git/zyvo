import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroHeader } from './header'
import { ChevronRight, CirclePlay } from 'lucide-react'
import Image from 'next/image'
import { HeroCarousel } from './hero-carousel'
import { EmblaOptionsType } from 'embla-carousel'
import SplitText from './SplitText/SplitText'
import BlurText from './BlurText/BlurText'
import FeaturedProducts from './featured-products'

export default function HeroSection() {
    const OPTIONS: EmblaOptionsType = { 
        loop: true, 
        duration: 10000, // Slower fade transition (2 seconds)
        containScroll: false // Recommended for Fade plugin
    }
    const SLIDE_COUNT = 5
    const SLIDES = Array.from(Array(SLIDE_COUNT).keys())

    return (
        <>
            <HeroHeader />
            <main className="overflow-hidden">
                <section className="bg-linear-to-b to-muted from-background">
                    <div className="relative py-36 mt-8">
                        {/* Text content */}
                        <div className="relative z-10 max-w-full mx-auto lg:px-36 px-4">                            
                            <div className="md:w-1/2">
                                <div>                                    
                                    <BlurText text='Shop Smarter, Live Better - Your Ultimate Store Experience' className="text-muted-foreground mt-4 text-6xl font-black" />
                                    <p className="text-muted-foreground my-8 max-w-2xl text-balance text-sm/6">Discover thousands of premium products, enjoy lightning-fast delivery, and experience seamless shopping like never before.</p>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="pr-4.5">
                                            <Link href="#link">
                                                <span className="text-nowrap">Shop Now</span>
                                                <ChevronRight className="opacity-50" />
                                            </Link>
                                        </Button>                                        
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <p className="text-muted-foreground text-sm">Trusted by teams at :</p>
                                    <div className="mt-6 grid max-w-sm grid-cols-3 gap-6">
                                        <div className="flex">
                                            <img
                                                className="h-4 w-fit"
                                                src="https://html.tailus.io/blocks/customers/column.svg"
                                                alt="Column Logo"
                                                height="16"
                                                width="auto"
                                            />
                                        </div>
                                        <div className="flex">
                                            <img
                                                className="h-5 w-fit"
                                                src="https://html.tailus.io/blocks/customers/nvidia.svg"
                                                alt="Nvidia Logo"
                                                height="20"
                                                width="auto"
                                            />
                                        </div>
                                        <div className="flex">
                                            <img
                                                className="h-4 w-fit"
                                                src="https://html.tailus.io/blocks/customers/github.svg"
                                                alt="GitHub Logo"
                                                height="16"
                                                width="auto"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Carousel */}
                        <div className="perspective-near mt-24 translate-x-12 md:absolute md:-right-6 md:bottom-16 md:left-1/2 md:top-40 md:mt-0 md:translate-x-0">
                            <div className="before:bg-foreground relative h-full before:absolute before:-inset-x-4 before:bottom-7 before:top-0 before:skew-x-6 before:rounded-[calc(var(--radius)+1rem)] before:opacity-5">
                                <div className="bg-background rounded-(--radius) shadow-foreground ring-foreground relative h-full -translate-y-12 skew-x-6 overflow-hidden shadow-md ring-1 ring-opacity-5" style={{ boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                                    <HeroCarousel slides={SLIDES} options={OPTIONS} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>
        </>
    )
}
