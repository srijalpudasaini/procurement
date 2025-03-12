import Header from '@/Components/Layout/Header';

export default function GuestLayout({ children }) {
    return (
        <>
            <Header />
            {children}
        </>
    );
}
