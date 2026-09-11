import InputError from "@/Components/Form/InputError";
import TextInput from "@/Components/Form/TextInput";
import Breadcrumb from "@/Components/ui/Breadcrumb";
import VendorLayout from "@/Layouts/VendorLayout";
import { Head, Link, useForm } from "@inertiajs/react";

const Apply = ({ eoi, hasApplied }) => {
    const breadCrumbItems = [
        {
            title: "Dashboard",
            href: "/vendor/dashboard",
        },
        {
            title: "Tenders",
            href: "/eoi",
        },
        {
            title: "Submit Proposal",
        },
    ];

    const openInput = (target) => {
        const el = document.getElementById(target);
        if (el) el.click();
    };

    const { data, setData, post, processing, errors } = useForm({
        eoi_id: eoi.id,
        deadline: eoi.deadline_date,
        delivery_date: "",
        products: eoi.purchase_request_items.map((p) => ({ id: p.id, price: 0 })),
        documents: eoi.eoi_documents.map((doc) => ({
            id: doc.document.id,
            file: null,
            required: doc.required,
        })),
    });

    const handleChange = (e, id) => {
        const checked = e.target.checked;
        if (!checked) {
            setData(
                "products",
                data.products.filter((p) => p.id != id)
            );
        } else {
            if (!data.products.some((p) => p.id == id)) {
                setData("products", [
                    ...data.products,
                    eoi.purchase_request_items.find((p) => p.product.id == id)?.product,
                ]);
            }
        }
    };

    const handlePriceChange = (e, id) => {
        const { value } = e.target;
        setData(
            "products",
            data.products.map((product) =>
                product.id === id ? { ...product, price: value } : product
            )
        );
    };

    const handleFileChange = (e, id) => {
        const f = e.target.files[0];
        if (f) {
            setData(
                "documents",
                data.documents.map((doc) =>
                    doc.id === id ? { ...doc, file: f } : doc
                )
            );
        }
    };

    const handleFileRemove = (e, id) => {
        e.stopPropagation();
        setData(
            "documents",
            data.documents.map((doc) =>
                doc.id === id ? { ...doc, file: null } : doc
            )
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/vendor/eoi/submit");
    };

    const calculateEstimatedTotal = () => {
        return data.products.reduce((acc, p) => {
            const item = eoi.purchase_request_items.find((it) => it.id === p.id);
            const qty = item?.quantity || 1;
            const price = parseFloat(p.price) || 0;
            return acc + qty * price;
        }, 0);
    };

    return (
        <VendorLayout>
            <Head title={`Apply - ${eoi.title}`} />
            <Breadcrumb items={breadCrumbItems} />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                {/* Tender Header Banner */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#00AB66] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                Open Tender #{eoi.eoi_number}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800 mt-1">
                            {eoi.title}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Published on: <strong className="text-slate-700">{eoi.published_date}</strong> &bull; Submission Deadline: <strong className="text-rose-600">{eoi.deadline_date}</strong>
                        </p>
                    </div>

                    <Link
                        href={`/eoi/${eoi.id}`}
                        className="text-xs font-semibold text-slate-600 hover:text-[#00AB66] bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition self-start"
                        target="_blank"
                    >
                        <i className="fa fa-external-link mr-1"></i> Public Notice
                    </Link>
                </div>

                {/* Tender Description */}
                {eoi.description && (
                    <div className="py-4 border-b border-slate-100 text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-700 block mb-1">Tender Scope / Description:</strong>
                        <p className="bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                            {eoi.description}
                        </p>
                    </div>
                )}

                {hasApplied ? (
                    <div className="my-8 text-center bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00AB66] mx-auto flex items-center justify-center text-xl mb-3">
                            <i className="fa fa-check"></i>
                        </div>
                        <h3 className="text-base font-bold text-emerald-900">
                            Application Already Submitted
                        </h3>
                        <p className="text-xs text-emerald-700 mt-1">
                            You have already submitted a proposal for this tender. You can review your submitted bid under My Applications.
                        </p>
                        <Link
                            href="/vendor/eois"
                            className="inline-block mt-4 bg-[#00AB66] hover:bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                        >
                            Go to My Applications
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        {/* Items to Provide */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">
                                        Required Items & Price Proposal
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Select the items you can fulfill and enter your unit price quotation
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-slate-400">Estimated Total:</span>
                                    <p className="text-sm font-bold text-[#00AB66]">
                                        Rs. {calculateEstimatedTotal().toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                                        <tr>
                                            <th className="p-3 w-10 text-center">Include</th>
                                            <th className="p-3">Item Name</th>
                                            <th className="p-3 text-center">Unit</th>
                                            <th className="p-3 text-center">Required Qty</th>
                                            <th className="p-3">Specifications</th>
                                            <th className="p-3 text-right w-44">Offered Unit Price (Rs.)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {eoi.purchase_request_items.map((pro, index) => {
                                            const isSelected = data.products.some(
                                                (p) => p?.id === pro.id
                                            );
                                            const currentPrice =
                                                data.products.find((q) => q?.id === pro.id)?.price || "";

                                            return (
                                                <tr
                                                    key={index}
                                                    className={`hover:bg-slate-50/60 transition ${
                                                        !isSelected ? "opacity-40" : ""
                                                    }`}
                                                >
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => handleChange(e, pro.id)}
                                                            className="rounded border-slate-300 text-[#00AB66] focus:ring-emerald-500 w-4 h-4"
                                                        />
                                                    </td>
                                                    <td className="p-3 font-semibold text-slate-800">
                                                        {pro.product?.name}
                                                    </td>
                                                    <td className="p-3 text-center text-slate-600">
                                                        {pro.product?.unit || "Unit"}
                                                    </td>
                                                    <td className="p-3 text-center font-bold text-slate-700">
                                                        {pro.quantity}
                                                    </td>
                                                    <td className="p-3 text-slate-500 text-[11px]">
                                                        {pro.specifications || "Standard"}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <TextInput
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            className="py-1 text-right text-xs w-full"
                                                            placeholder="0.00"
                                                            onChange={(e) => handlePriceChange(e, pro.id)}
                                                            value={currentPrice}
                                                            disabled={!isSelected}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <InputError message={errors.products} className="mt-1" />
                            <InputError message={errors.generalProducts} className="mt-1" />
                        </div>

                        {/* Delivery Date */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-md">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Committed Delivery Date *
                            </label>
                            <p className="text-[11px] text-slate-400 mb-2">
                                Date by which you guarantee full order delivery upon tender award
                            </p>
                            <TextInput
                                type="date"
                                value={data.delivery_date}
                                className="w-full text-xs"
                                onChange={(e) => setData("delivery_date", e.target.value)}
                            />
                            <InputError message={errors.delivery_date} className="mt-1" />
                        </div>

                        {/* Required Documents Upload */}
                        <div>
                            <h2 className="text-sm font-bold text-slate-800 mb-1">
                                Required Verification Documents
                            </h2>
                            <p className="text-xs text-slate-400 mb-3">
                                Upload the necessary compliance documents, tax clearances, and certificates
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {eoi.eoi_documents.map((eoi_document) => {
                                    const docEntry = data.documents.find(
                                        (d) => d.id === eoi_document.document.id
                                    );
                                    const hasFile = docEntry?.file;

                                    return (
                                        <div
                                            key={eoi_document.id}
                                            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold text-slate-700">
                                                    {eoi_document.document.title}{" "}
                                                    {eoi_document.required && (
                                                        <span className="text-rose-500 font-bold">*</span>
                                                    )}
                                                </h4>
                                            </div>

                                            <div
                                                className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition ${
                                                    hasFile
                                                        ? "border-emerald-300 bg-emerald-50/50"
                                                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                                                }`}
                                                onClick={() =>
                                                    openInput(
                                                        `${eoi_document.document.name}_${eoi_document.document.id}`
                                                    )
                                                }
                                            >
                                                <input
                                                    type="file"
                                                    hidden
                                                    id={`${eoi_document.document.name}_${eoi_document.document.id}`}
                                                    onChange={(e) =>
                                                        handleFileChange(e, eoi_document.document.id)
                                                    }
                                                />

                                                {hasFile ? (
                                                    <div className="flex items-center justify-between px-2">
                                                        <span className="text-xs font-semibold text-emerald-800 truncate flex items-center gap-1.5">
                                                            <i className="fa fa-file-text-o text-emerald-600"></i>
                                                            {hasFile.name}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className="text-rose-500 hover:text-rose-700 text-sm ml-2"
                                                            onClick={(e) =>
                                                                handleFileRemove(e, eoi_document.document.id)
                                                            }
                                                        >
                                                            <i className="fa fa-times-circle"></i>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="py-2 text-slate-400">
                                                        <i className="fa fa-cloud-upload text-lg mb-1 block text-slate-400"></i>
                                                        <span className="text-xs text-slate-500 font-medium">
                                                            Click to upload document
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <InputError message={errors.generalDocuments} className="mt-1" />
                        </div>

                        {/* Tender Attachments */}
                        {eoi.files?.length > 0 && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="text-xs font-bold text-slate-700 mb-2">
                                    Official Tender Attachments & Specifications:
                                </h4>
                                <ul className="space-y-1">
                                    {eoi.files.map((file, index) => (
                                        <li key={index} className="text-xs">
                                            <a
                                                href={`/storage/${file.file_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[#00AB66] font-semibold hover:underline flex items-center gap-1.5"
                                            >
                                                <i className="fa fa-paperclip"></i>
                                                {file.file_name}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Submit Action */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <Link
                                href="/eoi"
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-4 py-2 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 bg-[#00AB66] hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm transition"
                            >
                                {processing ? (
                                    <>
                                        <i className="fa fa-spinner fa-spin"></i> Submitting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa fa-paper-plane"></i> Submit Proposal
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </VendorLayout>
    );
};

export default Apply;