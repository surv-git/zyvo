"use client"

import React from 'react'
import { EmblaOptionsType } from 'embla-carousel'
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import Autoplay from 'embla-carousel-autoplay'
import {
  NextButton,
  PrevButton,
  usePrevNextButtons
} from './carousel-arrow-buttons'
import { DotButton, useDotButton } from './carousel-dot-buttons'

type PropType = {
  slides: number[]
  options?: EmblaOptionsType
}

const HeroCarousel: React.FC<PropType> = (props) => {
  const { slides, options } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [Fade(), Autoplay({ delay: 3000 })])

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi)


  return (
    <div className="embla hero-carousel h-full">
      <div className="embla__viewport h-full" ref={emblaRef}>
        <div className="embla__container h-full">
          {slides.map((index) => (
            <div className="embla__slide h-full" key={index}>
              <img
                className="embla__slide__img w-full h-full"
                src={`/images/carousel-image-0${index + 1}.jpg`}
                alt={`Carousel image ${index + 1}`}
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                  width: '100%',
                  height: '100%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="embla__controls">        

        <div className="embla__dots">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={'embla__dot'.concat(
                index === selectedIndex ? ' embla__dot--selected' : ''
              )}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: index === selectedIndex ? '#3b82f6' : '#e5e7eb',
                border: '2px solid',
                borderColor: index === selectedIndex ? '#3b82f6' : '#d1d5db',
                margin: '0 4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: 1
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export { HeroCarousel }