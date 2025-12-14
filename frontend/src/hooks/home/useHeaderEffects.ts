'use client'

import { useEffect } from 'react'

export function useHeaderEffects() {
    useEffect(() => {
        const header = document.querySelector('header')

        const handleScroll = () => {
            if (window.scrollY > 50) {
                header?.classList.add('scrolled')
            } else {
                header?.classList.remove('scrolled')
            }
        }

        window.addEventListener('scroll', handleScroll)

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])
}
