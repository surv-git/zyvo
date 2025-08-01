import Image from 'next/image';
import { cn } from '../lib/utils'

export const Logo = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <>
<Image src="/images/logo-light.png" alt="Logo Icon" width={24} height={24} className={cn('h-6 w-6', className)} style={{ color: uniColor ? 'currentColor' : undefined }} /> 
<span className='text-md font-bold italic '>Zyvo</span>
</>
    )
}

export const LogoIcon = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <Image src="/images/logo-light.png" alt="Logo Icon" width={24} height={24} className={cn('h-6 w-6', className)} style={{ color: uniColor ? 'currentColor' : undefined }} />
    )
}

export const LogoStroke = ({ className }: { className?: string }) => {
    return (
        <Image src="/images/logo-light.png" alt="Logo Icon" width={24} height={24} className={cn('h-6 w-6', className)} style={{ color: uniColor ? 'currentColor' : undefined }} />
    )
}
