import { Link } from "@inertiajs/react"

const Breadcrumb = ({ items }) => {
    return (
        <ul className="flex mb-3">
            {items.map((item, index) => (
                    <li key={index} className={index === items.length - 1 ? "font-semibold" : ""}>
                        {index === items.length - 1 ? (
                            item.title
                        ) : (
                            <>
                                <Link href={item.href} className="text-gray-600">{item.title}</Link> /&nbsp;
                            </>
                        )}
                    </li>
                ))}
        </ul>
    )
}

export default Breadcrumb