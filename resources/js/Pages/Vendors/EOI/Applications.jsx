import Alert from "@/Components/ui/Alert";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import Modal from "@/Components/ui/Modal";
import VendorLayout from "@/Layouts/VendorLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import DataTable from "react-data-table-component";

const Applications = ({ applications }) => {
    const breadCrumbItems = [
        {
            title: "Dashboard",
            href: "/vendor/dashboard",
        },
        {
            title: "My Applications",
        },
    ];

    const { flash } = usePage().props;
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState(null);

    const viewDetail = (app) => {
        setSelectedApplication(app);
        setShowViewModal(true);
    };

    const calculateTotal = (proposals) => {
        if (!proposals || !proposals.length) return 0;
        return proposals.reduce((acc, p) => {
            const qty = p.purchase_request_item?.quantity || 1;
            const price = parseFloat(p.price) || 0;
            return acc + price * qty;
        }, 0);
    };

    const columns = [
        {
            name: "Tender / EOI",
            cell: (row) => (
                <div className="py-2">
                    <Link
                        href={`/eoi/${row.eoi?.id}`}
                        className="font-bold text-slate-800 hover:text-[#00AB66] transition block text-xs"
                    >
                        {row.eoi?.title || "Tender"}
                    </Link>
                    <span className="text-[10px] text-slate-400">
                        #{row.eoi?.eoi_number}
                    </span>
                </div>
            ),
            sortable: true,
            grow: 3,
        },
        {
            name: "Submitted Date",
            selector: (row) => row.application_date || "—",
            sortable: true,
            grow: 1,
        },
        {
            name: "Delivery Date",
            selector: (row) => row.delivery_date || "—",
            sortable: true,
            grow: 1,
        },
        {
            name: "Total Quoted",
            cell: (row) => {
                const total = calculateTotal(row.proposals);
                return (
                    <span className="font-semibold text-slate-700 text-xs">
                        {total > 0 ? `Rs. ${total.toLocaleString()}` : "—"}
                    </span>
                );
            },
            sortable: true,
            grow: 1.5,
        },
        {
            name: "Status",
            cell: (row) => {
                const status = row.status;
                const badgeClass =
                    status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : status === "rejected"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200";

                return (
                    <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${badgeClass}`}
                    >
                        {status}
                    </span>
                );
            },
            grow: 1,
        },
        {
            name: "Action",
            cell: (row) => (
                <div className="flex gap-2 justify-center">
                    <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-[#00AB66] border border-emerald-200 transition duration-150"
                        onClick={() => viewDetail(row)}
                    >
                        <i className="fa fa-eye"></i> Details
                    </button>
                </div>
            ),
            ignoreRowClick: true,
            grow: 1,
        },
    ];

    return (
        <VendorLayout>
            <Head title="My Applications" />
            <Breadcrumb items={breadCrumbItems} />

            {/* Application Details Modal */}
            <Modal show={showViewModal} onClose={() => setShowViewModal(false)}>
                <div className="p-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">
                                Application Details
                            </h2>
                            <p className="text-xs text-slate-500">
                                {selectedApplication?.eoi?.title} (#{selectedApplication?.eoi?.eoi_number})
                            </p>
                        </div>
                        <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${selectedApplication?.status === "approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : selectedApplication?.status === "rejected"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                        >
                            {selectedApplication?.status}
                        </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                            <span className="text-slate-400 font-medium">Submitted Date:</span>
                            <p className="font-semibold text-slate-700">
                                {selectedApplication?.application_date || "—"}
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-400 font-medium">Committed Delivery:</span>
                            <p className="font-semibold text-slate-700">
                                {selectedApplication?.delivery_date || "—"}
                            </p>
                        </div>
                    </div>

                    {/* Proposed Items Table */}
                    <div className="mt-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Quoted Items & Rates
                        </h3>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                                    <tr>
                                        <th className="p-2.5">Product</th>
                                        <th className="p-2.5 text-center">Qty</th>
                                        <th className="p-2.5 text-right">Unit Price</th>
                                        <th className="p-2.5 text-right">Total</th>
                                        <th className="p-2.5">Specifications</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {selectedApplication?.proposals?.map((pro, index) => {
                                        const qty = pro.purchase_request_item?.quantity || 1;
                                        const unitPrice = parseFloat(pro.price) || 0;
                                        const lineTotal = qty * unitPrice;

                                        return (
                                            <tr key={index} className="hover:bg-slate-50/50">
                                                <td className="p-2.5 font-medium text-slate-800">
                                                    {pro.purchase_request_item?.product?.name || "Item"}
                                                </td>
                                                <td className="p-2.5 text-center text-slate-600">
                                                    {qty}
                                                </td>
                                                <td className="p-2.5 text-right font-medium text-slate-700">
                                                    Rs. {unitPrice.toLocaleString()}
                                                </td>
                                                <td className="p-2.5 text-right font-bold text-slate-800">
                                                    Rs. {lineTotal.toLocaleString()}
                                                </td>
                                                <td className="p-2.5 text-slate-500 text-[11px]">
                                                    {pro.purchase_request_item?.specifications || "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
                                    <tr>
                                        <td colSpan={3} className="p-2.5 text-right">
                                            Grand Total Quoted:
                                        </td>
                                        <td className="p-2.5 text-right text-emerald-700">
                                            Rs. {calculateTotal(selectedApplication?.proposals).toLocaleString()}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Uploaded Documents */}
                    <div className="mt-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Uploaded Documents
                        </h3>
                        {selectedApplication?.documents?.length ? (
                            <ul className="space-y-1.5">
                                {selectedApplication.documents.map((doc, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200"
                                    >
                                        <span className="font-medium text-slate-700 flex items-center gap-2">
                                            <i className="fa fa-file-pdf-o text-rose-500"></i>
                                            {doc.document?.title || "Verification Document"}
                                        </span>
                                        <a
                                            href={`/storage/${doc.name}`}
                                            className="text-xs font-semibold text-[#00AB66] hover:underline flex items-center gap-1"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <i className="fa fa-download"></i> View File
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-slate-400 italic">
                                No documents attached to this application.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setShowViewModal(false)}
                            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Applications Table Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            Submitted Tender Applications
                        </h1>
                        <p className="text-xs text-slate-500">
                            Track the status and details of all your bids
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Show</span>
                        <select
                            className="py-1 px-2.5 text-xs rounded-lg border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                            value={applications.per_page}
                            onChange={(e) =>
                                router.get("/vendor/eois", {
                                    per_page: e.target.value,
                                })
                            }
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                        <span className="text-xs text-slate-500">entries</span>
                    </div>
                </div>

                {flash?.success && <Alert type="success" message={flash.success} />}
                {flash?.error && <Alert type="error" message={flash.error} />}

                <div className="my-2">
                    <DataTable
                        columns={columns}
                        data={applications.data}
                        pagination
                        paginationServer
                        paginationTotalRows={applications.total}
                        paginationPerPage={applications.per_page}
                        onChangePage={(page) => {
                            router.get(
                                "/vendor/eois",
                                {
                                    page,
                                    per_page: applications.per_page,
                                },
                                { preserveState: true, replace: true }
                            );
                        }}
                        onChangeRowsPerPage={(perPage) => {
                            router.get(
                                "/vendor/eois",
                                {
                                    per_page: perPage,
                                    page: 1,
                                },
                                { preserveState: true, replace: true }
                            );
                        }}
                        paginationComponentOptions={{ noRowsPerPage: true }}
                    />
                </div>
            </div>
        </VendorLayout>
    );
};

export default Applications;