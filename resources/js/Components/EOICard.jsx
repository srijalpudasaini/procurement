import { Link } from "@inertiajs/react";

export default function EOICard({eoi}) {
    return (
        <>
            <div className="eoi-card px-4 py-3 my-5 border-gray-400 rounded-md bg-white shadow-md">
                <h3 className="eoi-title text-2xl font-bold text-main mb-3">{eoi.title}</h3>
                <p className="mb-2">EOI number: {eoi.eoi_number}</p>
                <p className=""><i className="fa fa-calendar text-main"></i> Published Date: {eoi.published_date} | Apply before: {eoi.deadline_date}</p>
                <div className="text-end">
                    <Link href={`/eoi/${eoi.id}`} className="rounded-md bg-gray-800 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-gray-700 focus:bg-gray-700 focus:outline-none active:bg-gray-900">
                        <i className="fa fa-eye me-2"></i> View
                    </Link>
                </div>
            </div>
        </>
    )
}