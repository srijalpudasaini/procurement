import PrimaryButton from "./PrimaryButton";

export default function EOICard() {
    return (
        <>
            <div className="eoi-card px-4 py-3 my-5 border-gray-400 rounded-md bg-white shadow-md">
                <h3 className="eoi-title text-2xl font-bold text-main mb-3">Goods for an IT company</h3>
                <p className="mb-2"><i className="fa fa-map-marker text-main me-2"></i> Kathmandu, Nepal</p>
                <p className=""><i className="fa fa-calendar text-main"></i> Published Date: 2025-03-06 | Apply before: 2025-03-06</p>
                <div className="text-end">
                    <PrimaryButton disabled={false}>
                        <i className="fa fa-eye me-2"></i> View
                    </PrimaryButton>
                </div>
            </div>
        </>
    )
}