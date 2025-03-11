import ApplicationLogo from '@/Components/ApplicationLogo';
import Header from '@/Components/Header';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <>
            <Header />
            {children}
        </>
    );
}
