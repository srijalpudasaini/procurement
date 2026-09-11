import TextInput from '@/Components/Form/TextInput'
import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useEffect, useState, useMemo } from 'react'
import DataTable from 'react-data-table-component'

const ExpandedComponent = ({ data }) => (
    <div className='p-3 px-6 bg-gray-50 text-xs'>
        <h3 className='mb-2 font-semibold text-gray-800'>Product Quotations</h3>
        <table className='mb-3 w-full border border-gray-200 border-collapse text-left'>
            <thead>
                <tr className='bg-gray-100 text-gray-700 font-semibold border-b'>
                    <th className='p-2'>S.N.</th>
                    <th className='p-2'>Product</th>
                    <th className='p-2'>Unit</th>
                    <th className='p-2'>Qty</th>
                    <th className='p-2'>Unit Price Offered</th>
                    <th className='p-2 text-right'>Total</th>
                </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
                {data?.proposals?.map((proposal, index) => (
                    <tr key={proposal.id} className='bg-white'>
                        <td className='p-2 text-gray-500'>{index + 1}</td>
                        <td className='p-2 font-medium text-gray-800'>{proposal.purchase_request_item?.product?.name}</td>
                        <td className='p-2 text-gray-600'>{proposal.purchase_request_item?.product?.unit}</td>
                        <td className='p-2 text-gray-600'>{proposal.purchase_request_item?.quantity}</td>
                        <td className='p-2 font-mono'>Rs. {Number(proposal.price).toLocaleString()}</td>
                        <td className='p-2 font-mono font-semibold text-right'>
                            Rs. {(proposal.price * (proposal.purchase_request_item?.quantity || 1)).toLocaleString()}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>

        {data?.documents && data.documents.length > 0 && (
            <div>
                <h3 className='mb-1.5 font-semibold text-gray-800'>Uploaded Documents</h3>
                <div className='flex gap-3 flex-wrap'>
                    {data.documents.map((doc, index) => (
                        <a
                            key={index}
                            href={`/storage/${doc.name}`}
                            className='inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 bg-white border border-gray-200 px-2.5 py-1 rounded text-xs transition'
                            target='_blank'
                            rel='noreferrer'
                        >
                            <i className='fa fa-file-pdf text-rose-500'></i>
                            <span>{doc.document?.title || doc.name}</span>
                        </a>
                    ))}
                </div>
            </div>
        )}
    </div>
);

// TOPSIS Criteria Configuration & Presets
const CRITERIA_CONFIG = {
    price: { key: 'price', label: 'Price', type: 'cost', unit: 'NPR', defaultWeight: 35 },
    delivery_days: { key: 'delivery_days', label: 'Delivery Time', type: 'cost', unit: 'Days', defaultWeight: 20 },
    rating: { key: 'rating', label: 'Vendor Rating', type: 'benefit', unit: '★', defaultWeight: 20 },
    doc_compliance: { key: 'doc_compliance', label: 'Compliance', type: 'benefit', unit: '%', defaultWeight: 15 },
    product_coverage: { key: 'product_coverage', label: 'Coverage', type: 'benefit', unit: '%', defaultWeight: 10 },
};

const STRATEGY_PRESETS = [
    { id: 'balanced', name: 'Balanced', weights: { price: 35, delivery_days: 20, rating: 20, doc_compliance: 15, product_coverage: 10 } },
    { id: 'cost', name: 'Cost-Driven', weights: { price: 60, delivery_days: 10, rating: 10, doc_compliance: 10, product_coverage: 10 } },
    { id: 'speed', name: 'Fast Delivery', weights: { price: 15, delivery_days: 50, rating: 15, doc_compliance: 10, product_coverage: 10 } },
    { id: 'quality', name: 'High Trust', weights: { price: 15, delivery_days: 15, rating: 40, doc_compliance: 20, product_coverage: 10 } },
];

// Pure Mathematical TOPSIS Calculation (runs client-side for zero-latency slider interaction)
function calculateClientTopsis(rawMatrix, weights, criteriaMeta, metadata) {
    if (!rawMatrix || Object.keys(rawMatrix).length === 0) return null;

    const appIds = Object.keys(rawMatrix);
    const criteriaKeys = Object.keys(criteriaMeta);

    // 1. Normalize weights so sum = 1
    const totalWeight = criteriaKeys.reduce((acc, k) => acc + (Number(weights[k]) || 0), 0) || 1;
    const normWeights = {};
    criteriaKeys.forEach(k => {
        normWeights[k] = (Number(weights[k]) || 0) / totalWeight;
    });

    // 2. Vector Normalization: r_ij = x_ij / sqrt(sum_k(x_kj^2))
    const normDenom = {};
    criteriaKeys.forEach(k => {
        let sumSq = 0;
        appIds.forEach(id => {
            const val = Number(rawMatrix[id]?.[k]) || 0;
            sumSq += val * val;
        });
        normDenom[k] = Math.sqrt(sumSq) || 1;
    });

    const normalized = {};
    appIds.forEach(id => {
        normalized[id] = {};
        criteriaKeys.forEach(k => {
            normalized[id][k] = (Number(rawMatrix[id]?.[k]) || 0) / normDenom[k];
        });
    });

    // 3. Weighted Normalized Matrix: v_ij = w_j * r_ij
    const weighted = {};
    appIds.forEach(id => {
        weighted[id] = {};
        criteriaKeys.forEach(k => {
            weighted[id][k] = normalized[id][k] * normWeights[k];
        });
    });

    // 4. Positive-Ideal (A+) and Negative-Ideal (A-)
    const idealBest = {};
    const idealWorst = {};
    criteriaKeys.forEach(k => {
        const colVals = appIds.map(id => weighted[id][k]);
        const maxVal = Math.max(...colVals);
        const minVal = Math.min(...colVals);

        if (criteriaMeta[k]?.type === 'benefit') {
            idealBest[k] = maxVal;
            idealWorst[k] = minVal;
        } else {
            idealBest[k] = minVal;
            idealWorst[k] = maxVal;
        }
    });

    // 5. Euclidean Separation Distances & Closeness
    const distances = {};
    const closeness = {};

    appIds.forEach(id => {
        let dPlusSum = 0;
        let dMinusSum = 0;
        criteriaKeys.forEach(k => {
            const v = weighted[id][k];
            dPlusSum += Math.pow(v - idealBest[k], 2);
            dMinusSum += Math.pow(v - idealWorst[k], 2);
        });

        const dPlus = Math.sqrt(dPlusSum);
        const dMinus = Math.sqrt(dMinusSum);
        distances[id] = { dPlus, dMinus };

        const totalDist = dPlus + dMinus;
        closeness[id] = totalDist > 0 ? (dMinus / totalDist) : 0.5;
    });

    const sortedIds = [...appIds].sort((a, b) => closeness[b] - closeness[a]);

    const minPrice = Math.min(...appIds.map(id => Number(metadata?.[id]?.raw_price ?? rawMatrix[id]?.price ?? 0)));
    const minDelivery = Math.min(...appIds.map(id => Number(rawMatrix[id]?.delivery_days ?? 999)));
    const maxRating = Math.max(...appIds.map(id => Number(rawMatrix[id]?.rating ?? 0)));

    const rankings = {};
    sortedIds.forEach((id, idx) => {
        const vendorPrice = Number(metadata?.[id]?.raw_price ?? rawMatrix[id]?.price ?? 0);
        const vendorDelivery = Number(rawMatrix[id]?.delivery_days ?? 0);
        const vendorRating = Number(rawMatrix[id]?.rating ?? 0);
        const vendorDoc = Number(rawMatrix[id]?.doc_compliance ?? 0);

        const strengths = [];
        if (vendorPrice <= minPrice) strengths.push('Lowest Price');
        if (vendorDelivery <= minDelivery) strengths.push('Fastest Delivery');
        if (vendorRating >= maxRating) strengths.push('Highest Rating');
        if (vendorDoc >= 1.0) strengths.push('100% Compliant');

        rankings[id] = {
            id,
            vendor_name: metadata?.[id]?.vendor_name || `Vendor #${id}`,
            rank: idx + 1,
            score: closeness[id],
            percentage: (closeness[id] * 100).toFixed(1),
            dPlus: distances[id].dPlus,
            dMinus: distances[id].dMinus,
            strengths,
            price: vendorPrice,
            deliveryDays: vendorDelivery,
            rating: vendorRating,
            docCompliance: (vendorDoc * 100).toFixed(0),
            coverage: ((rawMatrix[id]?.product_coverage ?? 1) * 100).toFixed(0),
        };
    });

    return {
        rankings,
        sortedIds,
        rawMatrix,
        normalized,
        weighted,
        idealBest,
        idealWorst,
        distances,
        normWeights,
        criteriaMeta,
    };
}

const SubmissionEOI = ({ eoi, submissions, topsisRankings, topsisDetails }) => {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    const mustHave = [];

    urlParams.forEach((value, key) => {
        if (key.startsWith('mustHave[')) {
            mustHave.push(parseInt(value));
        } else {
            params[key] = value;
        }
    });

    const { flash } = usePage().props;

    // Interactive TOPSIS State
    const [weights, setWeights] = useState({
        price: 35,
        delivery_days: 20,
        rating: 20,
        doc_compliance: 15,
        product_coverage: 10,
    });
    const [activePreset, setActivePreset] = useState('balanced');
    const [showWeightsPanel, setShowWeightsPanel] = useState(false);
    const [showMathModal, setShowMathModal] = useState(false);
    const [mathModalTab, setMathModalTab] = useState(0);

    // Real-time client-side TOPSIS
    const liveTopsis = useMemo(() => {
        if (!topsisDetails?.matrix) return null;
        return calculateClientTopsis(topsisDetails.matrix, weights, CRITERIA_CONFIG, topsisDetails.metadata);
    }, [topsisDetails, weights]);

    const applyPreset = (preset) => {
        setActivePreset(preset.id);
        setWeights({ ...preset.weights });
    };

    const handleWeightChange = (key, val) => {
        setActivePreset('custom');
        setWeights(prev => ({
            ...prev,
            [key]: Math.max(0, Math.min(100, Number(val) || 0))
        }));
    };

    const resetWeights = () => {
        applyPreset(STRATEGY_PRESETS[0]);
    };

    const [filters, setFilters] = useState({
        allProducts: params.all_products === '1',
        allDocuments: params.all_documents === '1',
        minPrice: params.min_price || '',
        maxPrice: params.max_price || '',
        sortBy: params.sort_by || '',
        sort: params.sort || 'asc',
        rating: params.rating || '',
        productCoverage: params.product_coverage || false,
        mostPriority: params.most_priority || false,
        mustHave: mustHave,
        deliveryTime: params.deliveryTime || ''
    });

    const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const columns = [
        {
            name: "Vendor",
            cell: row => (
                <div>
                    <div className="font-semibold text-gray-900">{row.vendor?.name}</div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <span className="text-amber-500 font-bold">{row.vendor?.rating || 'N/A'} ★</span>
                        {/* <span>({row.vendor?.rating_count || 0} reviews)</span> */}
                    </div>
                </div>
            ),
            sortable: true,
            selector: row => row.vendor?.name,
        },
        { name: "Submission Date", selector: row => row.application_date, sortable: true },
        { name: "Delivery Date", selector: row => row.delivery_date, sortable: true },
        {
            name: "Quotation Total",
            selector: row => row.proposals?.reduce((total, proposal) =>
                total + proposal.price * (proposal.purchase_request_item?.quantity || 1), 0
            ),
            cell: row => {
                const total = row.proposals?.reduce((sum, p) => sum + (p.price * (p.purchase_request_item?.quantity || 1)), 0) || 0;
                return <span className="font-mono font-semibold text-gray-900">Rs. {Number(total).toLocaleString()}</span>;
            },
            sortable: true
        },
        {
            name: "Status",
            cell: row => (
                <span className={`rounded px-2 py-0.5 capitalize text-xs font-medium ${row.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        row.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                    {row.status}
                </span>
            )
        },
        {
            name: "TOPSIS Evaluation",
            cell: row => {
                const topsis = liveTopsis?.rankings?.[row.id] || row.topsis;
                if (!topsis) return <span className="text-gray-400 text-xs">-</span>;

                const isRank1 = topsis.rank === 1;
                const scorePercent = topsis.percentage || (topsis.score * 100).toFixed(1);

                return (
                    <div className="flex items-center gap-2 py-1">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-xs ${isRank1
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                            Rank #{topsis.rank}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 font-mono">
                            {scorePercent}%
                        </span>
                        {topsis.strengths && topsis.strengths.length > 0 && (
                            <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.2 rounded hidden sm:inline">
                                {topsis.strengths[0]}
                            </span>
                        )}
                    </div>
                );
            },
            sortable: true,
            selector: row => liveTopsis?.rankings?.[row.id]?.score || row.topsis?.score || 0,
        },
        {
            name: "Action",
            cell: row => (
                <button
                    type="button"
                    className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                    View
                </button>
            ),
            ignoreRowClick: true,
        }
    ];

    const breadCrumbItems = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'EOIs', href: '/eois' },
        { title: 'Submissions' },
    ];

    useEffect(() => {
        if (isInitialLoad) {
            setIsInitialLoad(false);
            return;
        }
        handleFilterChange();
    }, [filters]);

    const handleFilterChange = () => {
        if (isInitialLoad) return;
        try {
            router.get(`/eois/submissions/${eoi.id}`, {
                per_page: submissions.per_page,
                min_price: filters.minPrice || null,
                max_price: filters.maxPrice || null,
                rating: filters.rating || null,
                all_products: filters.allProducts ? 1 : null,
                all_documents: filters.allDocuments ? 1 : null,
                product_coverage: filters.productCoverage ? 1 : null,
                most_priority: filters.mostPriority ? 1 : null,
                sort_by: filters.sortBy || null,
                sort: filters.sort || null,
                mustHave: filters.mustHave,
                deliveryTime: filters.deliveryTime,
                page: 1
            }, {
                preserveState: true,
                replace: false,
                preserveScroll: true,
                only: ['submissions']
            });
        } catch (error) {
            console.error('Filter error:', error);
        }
    };

    const totalWeightsSum = Object.values(weights).reduce((a, b) => a + (Number(b) || 0), 0) || 1;

    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />

            <div className="bg-white p-4 shadow-sm sm:rounded-lg sm:p-6 mb-6">
                {/* Header: Clean and simple */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900">EOI Submissions</h1>
                            <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                {eoi.eoi_number}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{eoi.title}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setShowWeightsPanel(!showWeightsPanel)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition inline-flex items-center gap-1.5 ${showWeightsPanel
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            <i className="fa fa-sliders-h text-emerald-600"></i>
                            <span>{showWeightsPanel ? 'Hide Criteria Sliders' : 'Tune Priorities'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowMathModal(true)}
                            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition inline-flex items-center gap-1.5"
                        >
                            <i className="fa fa-table text-emerald-600"></i>
                            <span>View Decision Matrix</span>
                        </button>
                    </div>
                </div>

                {/* Collapsible Criteria Weight Tuner */}
                {showWeightsPanel && liveTopsis && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-200">
                            <span className="font-semibold text-gray-800">
                                Simulated Criteria Priorities:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {STRATEGY_PRESETS.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => applyPreset(preset)}
                                        className={`px-2.5 py-1 text-xs rounded border transition ${activePreset === preset.id
                                                ? 'bg-emerald-600 text-white border-emerald-600 font-medium'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                            }`}
                                    >
                                        {preset.name}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={resetWeights}
                                    title="Reset to default benchmark"
                                    className="px-2 py-1 text-gray-500 hover:text-gray-800 bg-white border border-gray-300 rounded transition"
                                >
                                    <i className="fa fa-undo"></i>
                                </button>
                            </div>
                        </div>

                        {/* Sliders Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3">
                            {Object.keys(CRITERIA_CONFIG).map((cKey) => {
                                const cfg = CRITERIA_CONFIG[cKey];
                                const rawVal = weights[cKey] || 0;
                                const pct = ((rawVal / totalWeightsSum) * 100).toFixed(0);

                                return (
                                    <div key={cKey} className="bg-white p-2.5 rounded border border-gray-200">
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="font-medium text-gray-800">{cfg.label}</span>
                                            <span className="font-bold text-emerald-700 font-mono">{pct}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="5"
                                            value={rawVal}
                                            onChange={(e) => handleWeightChange(cKey, e.target.value)}
                                            className="w-full accent-[#00AB66] h-1 bg-gray-200 rounded cursor-pointer"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Compact Ranking Summary Strip */}
                {liveTopsis && liveTopsis.sortedIds.length > 0 && (
                    <div className="my-4 p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg flex items-center justify-between flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-emerald-950 flex items-center gap-1">
                                <i className="fa fa-award text-emerald-600"></i>
                                <span>TOPSIS Ranks:</span>
                            </span>
                            {liveTopsis.sortedIds.map((id) => {
                                const r = liveTopsis.rankings[id];
                                const isFirst = r.rank === 1;
                                return (
                                    <span
                                        key={id}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${isFirst
                                                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                                : 'bg-white text-gray-700 border border-gray-200'
                                            }`}
                                    >
                                        #{r.rank} {r.vendor_name} ({r.percentage}%)
                                    </span>
                                );
                            })}
                        </div>
                        {liveTopsis.sortedIds[0] && (
                            <span className="text-xs text-emerald-900 font-medium">
                                Optimal Choice: <strong>{liveTopsis.rankings[liveTopsis.sortedIds[0]]?.vendor_name}</strong>
                            </span>
                        )}
                    </div>
                )}

                {/* Submissions Filter Toolbar */}
                <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span>Show</span>
                        <select
                            className="py-1 px-2 border rounded text-xs"
                            value={submissions.per_page}
                            onChange={(e) => router.get(`/eois/submissions/${eoi.id}`, {
                                per_page: e.target.value
                            }, { preserveState: true })}
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                        </select>
                        <span>entries</span>
                    </div>

                    <div
                        className={`border border-gray-300 rounded py-1 px-3 cursor-pointer select-none flex items-center gap-1.5 text-xs transition ${filterDropdownOpen ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'
                            }`}
                        onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    >
                        <i className="fa fa-filter text-gray-500"></i>
                        <span>Filter</span>
                    </div>
                </div>

                {/* Filter Options */}
                {filterDropdownOpen && (
                    <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200 space-y-3 text-xs">
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                className={`py-1 px-2.5 rounded border text-xs ${filters.allProducts ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'bg-white border-gray-300 text-gray-700'
                                    }`}
                                onClick={() => setFilters({ ...filters, allProducts: !filters.allProducts, mustHave: [] })}
                            >
                                All Products Quoted
                            </button>
                            <button
                                type="button"
                                className={`py-1 px-2.5 rounded border text-xs ${filters.allDocuments ? 'bg-[#00AB66] text-white border-[#00AB66]' : 'bg-white border-gray-300 text-gray-700'
                                    }`}
                                onClick={() => setFilters({ ...filters, allDocuments: !filters.allDocuments })}
                            >
                                All Documents Attached
                            </button>
                        </div>

                        {/* Price Range Filter */}
                        <div className="flex gap-2 items-center">
                            <span className="text-gray-600">Price Range:</span>
                            <TextInput
                                value={filters.minPrice}
                                placeholder="Min"
                                className="py-1 px-2 border rounded text-xs w-24"
                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            />
                            <span className="text-gray-400">-</span>
                            <TextInput
                                value={filters.maxPrice}
                                placeholder="Max"
                                className="py-1 px-2 border rounded text-xs w-24"
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {flash?.success && <div className="mt-3"><Alert type='success' message={flash.success} /></div>}
                {flash?.error && <div className="mt-3"><Alert type='error' message={flash.error} /></div>}

                {/* Submissions DataTable */}
                <div className="my-4 overflow-hidden rounded border border-gray-200">
                    <DataTable
                        columns={columns}
                        data={submissions.data}
                        expandableRows
                        expandableRowsComponent={ExpandedComponent}
                        pagination
                        paginationServer
                        paginationTotalRows={submissions.total}
                        paginationPerPage={submissions.per_page}
                        onChangePage={(page) => {
                            router.get(`/eois/submissions/${eoi.id}`, {
                                page,
                                per_page: submissions.per_page
                            }, { preserveState: true });
                        }}
                        onChangeRowsPerPage={(perPage) => {
                            router.get(`/eois/submissions/${eoi.id}`, {
                                per_page: perPage,
                                page: 1
                            }, { preserveState: true });
                        }}
                        paginationComponentOptions={{ noRowsPerPage: true }}
                    />
                </div>
            </div>

            {/* Simple Decision Matrix Modal */}
            {showMathModal && liveTopsis && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full shadow-lg border border-gray-200 overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900">
                                    TOPSIS Decision Breakdown
                                </h2>
                                <p className="text-[11px] text-gray-500">
                                    Mathematical step-by-step matrix evaluation
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowMathModal(false)}
                                className="text-gray-400 hover:text-gray-700 p-1 text-base transition"
                            >
                                <i className="fa fa-times"></i>
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="flex border-b border-gray-200 bg-white px-4 text-xs font-medium">
                            {[
                                { idx: 0, title: 'Decision Matrix (X)' },
                                { idx: 1, title: 'Normalized (R)' },
                                { idx: 2, title: 'Weighted (V)' },
                                { idx: 3, title: 'Ideal Solutions' },
                                { idx: 4, title: 'Distances & Closeness' },
                            ].map((tab) => (
                                <button
                                    key={tab.idx}
                                    type="button"
                                    onClick={() => setMathModalTab(tab.idx)}
                                    className={`py-2.5 px-3 border-b-2 transition ${mathModalTab === tab.idx
                                            ? 'border-emerald-600 text-emerald-700 font-semibold'
                                            : 'border-transparent text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    {tab.title}
                                </button>
                            ))}
                        </div>

                        {/* Modal Content */}
                        <div className="p-5 max-h-[60vh] overflow-y-auto text-xs">
                            {mathModalTab === 0 && (
                                <table className="w-full text-left border border-gray-200 border-collapse">
                                    <thead className="bg-gray-50 border-b text-gray-700 font-semibold">
                                        <tr>
                                            <th className="p-2.5">Vendor</th>
                                            <th className="p-2.5 text-right">Price (NPR)</th>
                                            <th className="p-2.5 text-right">Lead Time (Days)</th>
                                            <th className="p-2.5 text-right">Rating (★)</th>
                                            <th className="p-2.5 text-right">Compliance (%)</th>
                                            <th className="p-2.5 text-right">Coverage (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {liveTopsis.sortedIds.map((id) => (
                                            <tr key={id} className="hover:bg-gray-50">
                                                <td className="p-2.5 font-medium text-gray-900">{liveTopsis.rankings[id]?.vendor_name}</td>
                                                <td className="p-2.5 text-right font-mono">Rs. {Number(liveTopsis.rawMatrix[id]?.price).toLocaleString()}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.rawMatrix[id]?.delivery_days} d</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.rawMatrix[id]?.rating} ★</td>
                                                <td className="p-2.5 text-right font-mono">{(liveTopsis.rawMatrix[id]?.doc_compliance * 100).toFixed(0)}%</td>
                                                <td className="p-2.5 text-right font-mono">{(liveTopsis.rawMatrix[id]?.product_coverage * 100).toFixed(0)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {mathModalTab === 1 && (
                                <table className="w-full text-left border border-gray-200 border-collapse">
                                    <thead className="bg-gray-50 border-b text-gray-700 font-semibold">
                                        <tr>
                                            <th className="p-2.5">Vendor</th>
                                            <th className="p-2.5 text-right">r(Price)</th>
                                            <th className="p-2.5 text-right">r(Delivery)</th>
                                            <th className="p-2.5 text-right">r(Rating)</th>
                                            <th className="p-2.5 text-right">r(Compliance)</th>
                                            <th className="p-2.5 text-right">r(Coverage)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {liveTopsis.sortedIds.map((id) => (
                                            <tr key={id} className="hover:bg-gray-50">
                                                <td className="p-2.5 font-medium text-gray-900">{liveTopsis.rankings[id]?.vendor_name}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.normalized[id]?.price?.toFixed(4)}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.normalized[id]?.delivery_days?.toFixed(4)}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.normalized[id]?.rating?.toFixed(4)}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.normalized[id]?.doc_compliance?.toFixed(4)}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.normalized[id]?.product_coverage?.toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {mathModalTab === 2 && (
                                <table className="w-full text-left border border-gray-200 border-collapse">
                                    <thead className="bg-gray-50 border-b text-gray-700 font-semibold">
                                        <tr>
                                            <th className="p-2.5">Vendor</th>
                                            <th className="p-2.5 text-right">v(Price)</th>
                                            <th className="p-2.5 text-right">v(Delivery)</th>
                                            <th className="p-2.5 text-right">v(Rating)</th>
                                            <th className="p-2.5 text-right">v(Compliance)</th>
                                            <th className="p-2.5 text-right">v(Coverage)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {liveTopsis.sortedIds.map((id) => (
                                            <tr key={id} className="hover:bg-gray-50">
                                                <td className="p-2.5 font-medium text-gray-900">{liveTopsis.rankings[id]?.vendor_name}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.weighted[id]?.price?.toFixed(4)}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.weighted[id]?.delivery_days?.toFixed(4)}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.weighted[id]?.rating?.toFixed(4)}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.weighted[id]?.doc_compliance?.toFixed(4)}</td>
                                                <td className="p-2.5 text-right font-mono">{liveTopsis.weighted[id]?.product_coverage?.toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {mathModalTab === 3 && (
                                <table className="w-full text-left border border-gray-200 border-collapse">
                                    <thead className="bg-gray-50 border-b text-gray-700 font-semibold">
                                        <tr>
                                            <th className="p-2.5">Benchmark</th>
                                            <th className="p-2.5 text-right">Price</th>
                                            <th className="p-2.5 text-right">Delivery</th>
                                            <th className="p-2.5 text-right">Rating</th>
                                            <th className="p-2.5 text-right">Compliance</th>
                                            <th className="p-2.5 text-right">Coverage</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr className="bg-emerald-50/40">
                                            <td className="p-2.5 font-bold text-emerald-900">Positive Ideal (A⁺)</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealBest?.price?.toFixed(4)}</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealBest?.delivery_days?.toFixed(4)}</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealBest?.rating?.toFixed(4)}</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealBest?.doc_compliance?.toFixed(4)}</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealBest?.product_coverage?.toFixed(4)}</td>
                                        </tr>
                                        <tr className="bg-rose-50/30">
                                            <td className="p-2.5 font-bold text-rose-900">Negative Ideal (A⁻)</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealWorst?.price?.toFixed(4)}</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealWorst?.delivery_days?.toFixed(4)}</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealWorst?.rating?.toFixed(4)}</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealWorst?.doc_compliance?.toFixed(4)}</td>
                                            <td className="p-2.5 text-right font-mono">{liveTopsis.idealWorst?.product_coverage?.toFixed(4)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}

                            {mathModalTab === 4 && (
                                <table className="w-full text-left border border-gray-200 border-collapse">
                                    <thead className="bg-gray-50 border-b text-gray-700 font-semibold">
                                        <tr>
                                            <th className="p-2.5">Rank</th>
                                            <th className="p-2.5">Vendor</th>
                                            <th className="p-2.5 text-right">Dist to Best (S⁺)</th>
                                            <th className="p-2.5 text-right">Dist to Worst (S⁻)</th>
                                            <th className="p-2.5 text-right">Closeness (Cᵢ*)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {liveTopsis.sortedIds.map((id) => {
                                            const r = liveTopsis.rankings[id];
                                            const isFirst = r.rank === 1;
                                            return (
                                                <tr key={id} className={isFirst ? 'bg-emerald-50/40 font-semibold' : 'hover:bg-gray-50'}>
                                                    <td className="p-2.5">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${isFirst ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            #{r.rank}
                                                        </span>
                                                    </td>
                                                    <td className="p-2.5 text-gray-900">{r.vendor_name}</td>
                                                    <td className="p-2.5 text-right font-mono text-gray-600">{r.dPlus?.toFixed(4)}</td>
                                                    <td className="p-2.5 text-right font-mono text-gray-600">{r.dMinus?.toFixed(4)}</td>
                                                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                                                        {r.percentage}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowMathModal(false)}
                                className="px-3 py-1 bg-gray-800 hover:bg-gray-900 text-white rounded text-xs transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
};

export default SubmissionEOI;