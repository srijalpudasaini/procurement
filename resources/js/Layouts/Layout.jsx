import Header from "@/Components/Layout/Header";

export default function Layout({ children }) {
    return (
        <>
            <Header />
            {children}
        </>
    )
}