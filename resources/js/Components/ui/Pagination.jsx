import { router } from "@inertiajs/react";

const Pagination = ({ links,per_page }) => {
    if (!links.length) return null;

    const handlePageChange = (url) => {
        router.get(url, {per_page}, { preserveState: true, preserveScroll: true });
    };
    return (
        <div className="flex items-center justify-end border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-end">
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                        {links.map((link, index) => (
                            link.url === null ? (
                                <span
                                    key={index}
                                    className="relative inline-flex items-center px-4 py-2 text-gray-400 bg-gray-100 cursor-not-allowed ring-1 ring-gray-300 ring-inset"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <button
                                    key={index}
                                    onClick={() => handlePageChange(link.url)}
                                    className={`relative z-10 inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ring-1 ring-gray-300 ring-inset
                                    ${link.active ? 'bg-indigo-600 text-white' : 'text-indigo-600 bg-white'}`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Pagination;
