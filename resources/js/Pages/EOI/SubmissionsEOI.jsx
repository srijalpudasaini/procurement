import TextInput from '@/Components/Form/TextInput'
import Alert from '@/Components/ui/Alert'
import Breadcrumb from '@/Components/ui/Breadcrumb'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Link, usePage, router } from '@inertiajs/react'
import React, { useEffect, useState, useMemo } from 'react'
import DataTable from 'react-data-table-component'
import axios from 'axios'

const ExpandedComponent = ({ data, onAwardItem, onRevokeItem, isSubmitting }) => (
    <div className='p-4 px-6 bg-gray-50/80 text-xs border-b border-gray-200'>
        <div className="flex items-center justify-between mb-3">
            <h3 className='font-bold text-gray-800 flex items-center gap-1.5'>
                <span>Products Quoted</span>
            </h3>
            <span className="text-[11px] text-gray-500">
                Vendor: <strong className="text-gray-800">{data?.vendor?.name}</strong>
            </span>
        </div>
        <table className='mb-3 w-full border border-gray-200 border-collapse text-left bg-white rounded-lg overflow-hidden shadow-2xs'>
            <thead>
                <tr className='bg-gray-100/80 text-gray-700 font-semibold border-b text-xs'>
                    <th className='p-2.5'>S.N.</th>
                    <th className='p-2.5'>Product</th>
                    <th className='p-2.5'>Unit</th>
                    <th className='p-2.5'>Qty</th>
                    <th className='p-2.5'>Unit Price</th>
                    <th className='p-2.5 text-right'>Total</th>
                    <th className='p-2.5 text-center'>Award Status</th>
                </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
                {data?.proposals?.map((proposal, index) => {
                    const isAwarded = proposal.status === 'awarded';
                    const isOtherAwarded = !isAwarded && proposal.purchase_request_item?.awarded_vendor_proposal_id;
                    const qty = proposal.purchase_request_item?.quantity || 1;
                    const lineTotal = proposal.price * qty;

                    return (
                        <tr key={proposal.id} className={isAwarded ? 'bg-emerald-50/60' : 'bg-white hover:bg-gray-50/50'}>
                            <td className='p-2.5 text-gray-400'>{index + 1}</td>
                            <td className='p-2.5 font-medium text-gray-900'>{proposal.purchase_request_item?.product?.name}</td>
                            <td className='p-2.5 text-gray-600'>{proposal.purchase_request_item?.product?.unit}</td>
                            <td className='p-2.5 text-gray-600'>{qty}</td>
                            <td className='p-2.5 font-mono'>Rs. {Number(proposal.price).toLocaleString()}</td>
                            <td className='p-2.5 font-mono font-semibold text-right text-gray-900'>
                                Rs. {lineTotal.toLocaleString()}
                            </td>
                            <td className='p-2.5 text-center'>
                                {isAwarded ? (
                                    <div className="inline-flex items-center gap-2">
                                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                                            <i className="fa fa-check"></i> Awarded
                                        </span>
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() => onRevokeItem && onRevokeItem(proposal.purchase_request_item_id)}
                                            className="text-rose-600 hover:text-rose-800 text-[11px] underline cursor-pointer disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : isOtherAwarded ? (
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => onAwardItem && onAwardItem(proposal.purchase_request_item_id, proposal.id)}
                                        className="text-[11px] font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 px-2.5 py-1 rounded transition disabled:opacity-50"
                                    >
                                        Select Instead
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => onAwardItem && onAwardItem(proposal.purchase_request_item_id, proposal.id)}
                                        className="text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1 rounded shadow-2xs transition disabled:opacity-50"
                                    >
                                        Award
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>

        {data?.documents && data.documents.length > 0 && (
            <div className="mt-3">
                <h4 className='mb-1.5 font-semibold text-gray-700 text-[11px] uppercase tracking-wider'>Attached Documents</h4>
                <div className='flex gap-2 flex-wrap'>
                    {data.documents.map((doc, index) => (
                        <a
                            key={index}
                            href={`/storage/${doc.name}`}
                            className='inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 bg-white border border-gray-200 px-2.5 py-1 rounded text-xs transition shadow-2xs'
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

const SubmissionEOI = ({ eoi, submissions, allApplications, topsisRankings, budgetBenchmarks }) => {
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

    // Award Popup Modal & Selection State
    const [showAwardModal, setShowAwardModal] = useState(false);
    const [draftSelections, setDraftSelections] = useState({}); // { [itemId]: proposalId }
    const [ratingModalVendor, setRatingModalVendor] = useState(null);
    const [selectedStars, setSelectedStars] = useState(5);
    const [hoveredStars, setHoveredStars] = useState(0);
    const [viewingApplication, setViewingApplication] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Interactive Optimizer Tool State (Backend Driven)
    const [activeOptimizerTab, setActiveOptimizerTab] = useState('knapsack'); // 'knapsack' | 'topsis'

    // Knapsack State
    const [knapsackBudget, setKnapsackBudget] = useState('');
    const [knapsackResult, setKnapsackResult] = useState(null);
    const [isKnapsackLoading, setIsKnapsackLoading] = useState(false);

    // TOPSIS Interactive State
    const [topsisStrategy, setTopsisStrategy] = useState('balanced');
    const [topsisResult, setTopsisResult] = useState(null);
    const [isTopsisLoading, setIsTopsisLoading] = useState(false);

    // Interactive TOPSIS strategy filter on main submissions table
    const [activePageStrategy, setActivePageStrategy] = useState('balanced');
    const [pageRankings, setPageRankings] = useState(topsisRankings || {});

    // All Vendor Applications (sorted by active TOPSIS rank)
    const vendorApplications = useMemo(() => {
        return (allApplications && allApplications.length > 0) ? allApplications : (submissions?.data || []);
    }, [allApplications, submissions]);

    const sortedVendorApplications = useMemo(() => {
        const list = [...vendorApplications];
        list.sort((a, b) => {
            const rankA = pageRankings[a.id]?.rank ?? a.topsis?.rank ?? 999;
            const rankB = pageRankings[b.id]?.rank ?? b.topsis?.rank ?? 999;
            return rankA - rankB;
        });
        return list;
    }, [vendorApplications, pageRankings]);

    // Calculate Multi-Vendor Award Metrics
    const awardStats = useMemo(() => {
        const items = eoi?.purchase_request_items || [];
        const totalItems = items.length;
        const awardedItems = items.filter(item => item.awarded_vendor_proposal_id);
        const awardedCount = awardedItems.length;

        let totalAmount = 0;
        const vendorBreakdown = {};

        awardedItems.forEach(item => {
            const proposal = item.awarded_proposal || item.proposals?.find(p => p.id === item.awarded_vendor_proposal_id);
            if (proposal) {
                const price = Number(proposal.price) || 0;
                const lineTotal = price * (item.quantity || 1);
                totalAmount += lineTotal;

                const vendor = proposal.eoi_vendor_application?.vendor;
                if (vendor) {
                    if (!vendorBreakdown[vendor.id]) {
                        vendorBreakdown[vendor.id] = {
                            vendor: vendor,
                            itemsCount: 0,
                            items: [],
                            totalAmount: 0,
                        };
                    }
                    vendorBreakdown[vendor.id].itemsCount += 1;
                    vendorBreakdown[vendor.id].items.push({
                        productName: item.product?.name,
                        quantity: item.quantity,
                        price: price,
                        total: lineTotal,
                    });
                    vendorBreakdown[vendor.id].totalAmount += lineTotal;
                }
            }
        });

        return {
            totalItems,
            awardedCount,
            isComplete: totalItems > 0 && awardedCount === totalItems,
            totalAmount,
            awardedVendors: Object.values(vendorBreakdown),
        };
    }, [eoi]);

    // Modal Selection Handlers
    const openAwardModal = (targetApp = null) => {
        const initial = {};
        if (targetApp && targetApp.proposals) {
            // Pre-select all products quoted by this vendor
            targetApp.proposals.forEach(p => {
                initial[p.purchase_request_item_id] = p.id;
            });
            // Keep existing awards for items this vendor didn't quote
            eoi?.purchase_request_items?.forEach(item => {
                if (!initial[item.id] && item.awarded_vendor_proposal_id) {
                    initial[item.id] = item.awarded_vendor_proposal_id;
                }
            });
        } else {
            // Load currently awarded proposals from EOI items
            eoi?.purchase_request_items?.forEach(item => {
                if (item.awarded_vendor_proposal_id) {
                    initial[item.id] = item.awarded_vendor_proposal_id;
                }
            });
        }
        setDraftSelections(initial);
        setKnapsackResult(null);
        setTopsisResult(null);

        // Pre-fill Knapsack budget with backend benchmark
        if (!knapsackBudget && budgetBenchmarks) {
            setKnapsackBudget(budgetBenchmarks.estTotal || budgetBenchmarks.minCost || '');
        }

        setShowAwardModal(true);
    };

    // Execute Knapsack optimization purely via backend endpoint (CSRF safe with Axios)
    const handleRunBackendKnapsack = async (customBudget = null) => {
        const budgetToUse = customBudget !== null ? Number(customBudget) : (Number(knapsackBudget) || 0);
        if (budgetToUse <= 0) {
            alert('Please enter a valid budget amount.');
            return;
        }
        if (customBudget !== null) {
            setKnapsackBudget(customBudget);
        }

        setIsKnapsackLoading(true);
        try {
            const response = await axios.post(`/eois/${eoi.id}/knapsack-recommend`, {
                budget: budgetToUse,
                strategy: 'standard',
            });

            const data = response.data;
            setKnapsackResult(data);
            setTopsisResult(null);

            if (data.selections && Object.keys(data.selections).length > 0) {
                setDraftSelections(data.selections);
            } else {
                alert('Budget is too low to fulfill any items. Please increase the budget.');
            }
        } catch (err) {
            console.error('Knapsack optimization error:', err);
            alert(err.response?.data?.message || 'Failed to compute knapsack optimization.');
        } finally {
            setIsKnapsackLoading(false);
        }
    };

    // Execute TOPSIS recommendation purely via backend endpoint (CSRF safe with Axios)
    const handleRunBackendTopsis = async (strategy = topsisStrategy) => {
        setTopsisStrategy(strategy);
        setIsTopsisLoading(true);
        try {
            const response = await axios.post(`/eois/${eoi.id}/topsis-recommend`, {
                strategy: strategy,
            });

            const data = response.data;
            setTopsisResult(data);
            setKnapsackResult(null);

            if (data.selections && Object.keys(data.selections).length > 0) {
                setDraftSelections(data.selections);
            }
        } catch (err) {
            console.error('TOPSIS recommendation error:', err);
            alert(err.response?.data?.message || 'Failed to compute TOPSIS recommendation.');
        } finally {
            setIsTopsisLoading(false);
        }
    };

    // Interactive TOPSIS strategy switcher on main submissions table
    const handlePageStrategyChange = async (strategy) => {
        setActivePageStrategy(strategy);
        try {
            const response = await axios.post(`/eois/${eoi.id}/topsis-recommend`, {
                strategy: strategy,
            });
            if (response.data?.rankings) {
                setPageRankings(response.data.rankings);
            }
        } catch (err) {
            console.error('Strategy switch error:', err);
        }
    };

    const handleDraftSelectVendor = (app) => {
        setDraftSelections(prev => {
            const next = { ...prev };
            app.proposals?.forEach(p => {
                next[p.purchase_request_item_id] = p.id;
            });
            return next;
        });
    };

    const handleDraftSelectProduct = (itemId, proposalId) => {
        setDraftSelections(prev => ({
            ...prev,
            [itemId]: proposalId,
        }));
    };

    const handleDraftDeselectProduct = (itemId) => {
        setDraftSelections(prev => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
    };

    const handleSaveAllAwards = () => {
        setIsSubmitting(true);
        router.post(`/eois/${eoi.id}/awards`, { selections: draftSelections }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAwardModal(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleRevokeAllAwards = () => {
        if (!confirm('Are you sure you want to revoke all awards for this EOI?')) return;
        setIsSubmitting(true);
        router.post(`/eois/${eoi.id}/awards/revoke-all`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setDraftSelections({});
                setShowAwardModal(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Live draft metrics for the award popup modal
    const draftStats = useMemo(() => {
        const items = eoi?.purchase_request_items || [];
        const totalItems = items.length;
        let selectedCount = 0;
        let totalCost = 0;
        const itemDetails = [];

        items.forEach(item => {
            const chosenPropId = draftSelections[item.id];
            let chosenProposal = null;
            let chosenVendor = null;

            if (chosenPropId) {
                for (const app of sortedVendorApplications) {
                    const found = app.proposals?.find(p => p.id === chosenPropId);
                    if (found) {
                        chosenProposal = found;
                        chosenVendor = app.vendor;
                        break;
                    }
                }
            }

            if (chosenProposal) {
                selectedCount += 1;
                const price = Number(chosenProposal.price) || 0;
                const qty = item.quantity || 1;
                totalCost += price * qty;
                itemDetails.push({
                    item,
                    chosenProposal,
                    chosenVendor,
                    price,
                    lineTotal: price * qty,
                });
            } else {
                itemDetails.push({
                    item,
                    chosenProposal: null,
                    chosenVendor: null,
                    price: 0,
                    lineTotal: 0,
                });
            }
        });

        return {
            totalItems,
            selectedCount,
            totalCost,
            itemDetails,
        };
    }, [eoi, draftSelections, sortedVendorApplications]);

    // Individual action handlers
    const handleAwardItem = (itemId, proposalId) => {
        setIsSubmitting(true);
        router.post(`/eois/${eoi.id}/items/${itemId}/award`, { proposal_id: proposalId }, {
            preserveScroll: true,
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleRevokeItem = (itemId) => {
        setIsSubmitting(true);
        router.post(`/eois/${eoi.id}/items/${itemId}/revoke`, {}, {
            preserveScroll: true,
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleRevokeApplication = (applicationId) => {
        setIsSubmitting(true);
        router.post(`/eois/${eoi.id}/applications/${applicationId}/revoke`, {}, {
            preserveScroll: true,
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleSubmitRating = (e) => {
        e.preventDefault();
        if (!ratingModalVendor) return;
        setIsSubmitting(true);
        router.post(`/vendors/${ratingModalVendor.id}/rating`, { rating: selectedStars }, {
            preserveScroll: true,
            onSuccess: () => {
                setRatingModalVendor(null);
            },
            onFinish: () => setIsSubmitting(false),
        });
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
                <div className="py-1">
                    <div className="font-semibold text-gray-900">{row.vendor?.name}</div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span className="text-amber-500 font-bold">{Number(row.vendor?.rating || 5).toFixed(1)} ★</span>
                        <span className="text-gray-400">({row.vendor?.rating_count || 0})</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setRatingModalVendor(row.vendor);
                                setSelectedStars(Math.round(row.vendor?.rating || 5));
                            }}
                            className="text-[10px] text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded font-medium transition cursor-pointer"
                            title="Rate this vendor"
                        >
                            ★ Rate
                        </button>
                    </div>
                </div>
            ),
            sortable: true,
            selector: row => row.vendor?.name,
        },
        { name: "Submitted Date", selector: row => row.application_date, sortable: true },
        { name: "Delivery Date", selector: row => row.delivery_date, sortable: true },
        {
            name: "Total Bid",
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
            cell: row => {
                const wonCount = row.proposals?.filter(p => p.status === 'awarded').length || 0;
                return (
                    <div>
                        <span className={`rounded-full px-2.5 py-0.5 capitalize text-xs font-semibold inline-flex items-center gap-1 ${
                            row.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : row.status === 'rejected'
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                            {row.status === 'approved' ? `✓ Awarded (${wonCount} item${wonCount !== 1 ? 's' : ''})` : row.status}
                        </span>
                    </div>
                );
            }
        },
        {
            name: "TOPSIS Evaluation",
            cell: row => {
                const topsis = pageRankings[row.id] || row.topsis;
                if (!topsis) return <span className="text-gray-400 text-xs">-</span>;

                const isRank1 = topsis.rank === 1;
                const scorePercent = topsis.percentage || (topsis.score * 100).toFixed(1);

                return (
                    <div className="flex items-center gap-2 py-1">
                        <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-xs ${
                            isRank1 ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-700'
                        }`}>
                            #{topsis.rank} {isRank1 && '(Top Match)'}
                        </span>
                        <span className="text-xs font-semibold text-gray-800 font-mono">
                            {scorePercent}%
                        </span>
                    </div>
                );
            },
            sortable: true,
            selector: row => pageRankings[row.id]?.score || row.topsis?.score || 0,
        },
        {
            name: "Action",
            cell: row => {
                const isApproved = row.status === 'approved';
                return (
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setViewingApplication(row)}
                            className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                        >
                            View
                        </button>
                        {isApproved ? (
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleRevokeApplication(row.id)}
                                className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
                                title="Cancel awards for this vendor"
                            >
                                Cancel Award
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openAwardModal(row)}
                                className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-2xs transition cursor-pointer inline-flex items-center gap-1"
                                title="Open Award popup to award contracts"
                            >
                                <i className="fa fa-trophy text-[11px]"></i>
                                <span>Award</span>
                            </button>
                        )}
                    </div>
                );
            },
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

    return (
        <AuthenticatedLayout>
            <Breadcrumb items={breadCrumbItems} />

            <div className="bg-white p-5 sm:p-6 shadow-sm sm:rounded-xl mb-6">
                {/* Header: Clean, unified button naming */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-gray-100 gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-xl font-bold text-gray-900">EOI Submissions</h1>
                            <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                {eoi.eoi_number}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{eoi.title}</p>
                    </div>
                </div>

                {/* Clean Award Summary Banner with Consistent Action Button */}
                <div className="my-5 p-4 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/70 via-teal-50/30 to-white shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-emerald-600 text-white font-bold text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                                    <i className="fa fa-lock"></i> Closed EOI
                                </span>
                                <span className="text-xs font-semibold text-gray-700">
                                    {awardStats.isComplete ? 'All Products Awarded' : `${awardStats.awardedCount} of ${awardStats.totalItems} Products Awarded`}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-gray-900 mt-1.5">
                                Vendor & Product Awards
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Award contracts to multiple vendors using 0/1 Knapsack budget limits or TOPSIS multi-criteria optimization.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="bg-white px-3.5 py-2 rounded-lg border border-gray-200 shadow-2xs">
                                <span className="text-[11px] text-gray-500 block font-medium">Total Allocated</span>
                                <span className="text-sm font-bold font-mono text-emerald-800">
                                    Rs. {awardStats.totalAmount.toLocaleString()}
                                </span>
                            </div>
                            <div className="bg-white px-3.5 py-2 rounded-lg border border-gray-200 shadow-2xs">
                                <span className="text-[11px] text-gray-500 block font-medium">Winning Vendors</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {awardStats.awardedVendors.length}
                                </span>
                            </div>
                            {eoi.status === 'closed' && (
                                <button
                                    type="button"
                                    onClick={() => openAwardModal()}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-2xs transition cursor-pointer"
                                >
                                    <span>{awardStats.awardedCount > 0 ? 'Edit Award Contracts' : 'Award Contracts'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Awarded Vendors Pills */}
                    {awardStats.awardedVendors.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-emerald-200/60 flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-semibold text-gray-700">Awarded to:</span>
                            {awardStats.awardedVendors.map(({ vendor, itemsCount, totalAmount: vTotal }) => (
                                <div key={vendor.id} className="inline-flex items-center gap-1.5 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
                                    <strong className="text-gray-900">{vendor.name}</strong>
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                                        {itemsCount} item{itemsCount > 1 ? 's' : ''} (Rs. {vTotal.toLocaleString()})
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRatingModalVendor(vendor);
                                            setSelectedStars(Math.round(vendor.rating || 5));
                                        }}
                                        className="text-amber-500 hover:text-amber-600 font-bold ml-0.5 cursor-pointer"
                                        title="Rate this vendor"
                                    >
                                        {Number(vendor.rating || 5).toFixed(1)} ★
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submissions Filter Toolbar with Interactive TOPSIS Strategy Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                    {/* Strategy Pills for live ranking evaluation */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-500 mr-1 flex items-center gap-1">
                            <i className="fa fa-sliders-h text-emerald-600"></i> Strategy:
                        </span>
                        {[
                            { id: 'balanced', label: 'Balanced' },
                            { id: 'cost', label: 'Lowest Price' },
                            { id: 'speed', label: 'Fast Delivery' },
                            { id: 'quality', label: 'High Rating' },
                        ].map(st => (
                            <button
                                key={st.id}
                                type="button"
                                onClick={() => handlePageStrategyChange(st.id)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                                    activePageStrategy === st.id
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <span>Show</span>
                            <select
                                className="py-1 px-2.5 border border-gray-300 rounded-md text-xs bg-white"
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
                            className={`border border-gray-300 rounded-md py-1 px-3 cursor-pointer select-none flex items-center gap-1.5 text-xs transition ${
                                filterDropdownOpen ? 'bg-gray-100 text-gray-900' : 'bg-white hover:bg-gray-50 text-gray-700'
                            }`}
                            onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                        >
                            <i className="fa fa-filter text-gray-500"></i>
                            <span>Filters</span>
                        </div>
                    </div>
                </div>

                {/* Filter Options Dropdown */}
                {filterDropdownOpen && (
                    <div className="mt-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-xs">
                        <div className="flex gap-2 flex-wrap">
                            <button
                                type="button"
                                className={`py-1 px-3 rounded-md border text-xs transition cursor-pointer ${
                                    filters.allProducts ? 'bg-emerald-600 text-white border-emerald-600 font-medium' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setFilters({ ...filters, allProducts: !filters.allProducts, mustHave: [] })}
                            >
                                All Products Quoted
                            </button>
                            <button
                                type="button"
                                className={`py-1 px-3 rounded-md border text-xs transition cursor-pointer ${
                                    filters.allDocuments ? 'bg-emerald-600 text-white border-emerald-600 font-medium' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setFilters({ ...filters, allDocuments: !filters.allDocuments })}
                            >
                                All Documents Attached
                            </button>
                        </div>

                        <div className="flex gap-2 items-center">
                            <span className="text-gray-600">Price Range:</span>
                            <TextInput
                                value={filters.minPrice}
                                placeholder="Min"
                                className="py-1 px-2.5 border rounded-md text-xs w-28 bg-white"
                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                            />
                            <span className="text-gray-400">-</span>
                            <TextInput
                                value={filters.maxPrice}
                                placeholder="Max"
                                className="py-1 px-2.5 border rounded-md text-xs w-28 bg-white"
                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {flash?.success && <div className="mt-3"><Alert type='success' message={flash.success} /></div>}
                {flash?.error && <div className="mt-3"><Alert type='error' message={flash.error} /></div>}

                {/* Submissions DataTable */}
                <div className="my-5 overflow-hidden rounded-xl border border-gray-200 shadow-2xs">
                    <DataTable
                        columns={columns}
                        data={submissions.data}
                        expandableRows
                        expandableRowsComponent={props => (
                            <ExpandedComponent
                                {...props}
                                onAwardItem={handleAwardItem}
                                onRevokeItem={handleRevokeItem}
                                isSubmitting={isSubmitting}
                            />
                        )}
                        pagination
                        paginationServer
                        paginationTotalRows={submissions.total}
                        paginationPerPage={submissions.per_page}
                        onChangePage={(page) => router.get(`/eois/submissions/${eoi.id}`, { page }, { preserveState: true })}
                        customStyles={{
                            headRow: {
                                style: {
                                    backgroundColor: '#f9fafb',
                                    borderBottomColor: '#e5e7eb',
                                    fontWeight: '600',
                                    fontSize: '12px',
                                    color: '#374151',
                                }
                            },
                            rows: {
                                style: {
                                    fontSize: '12px',
                                    minHeight: '48px',
                                }
                            }
                        }}
                    />
                </div>
            </div>

            {/* Award Popup Modal (Spacious & Clean Layout with Knapsack & TOPSIS) */}
            {showAwardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-5xl w-full overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                                    <i className="fa fa-trophy text-sm"></i>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        Award Contracts to Vendors
                                    </h2>
                                    <p className="text-xs text-gray-400 line-clamp-1">
                                        {eoi.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAwardModal(false)}
                                className="text-gray-400 hover:text-white text-xl font-bold cursor-pointer p-1"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-5">
                            {/* 1. Selection Status Overview Box */}
                            <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                    <div>
                                        <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                            <i className="fa fa-check-circle text-emerald-600"></i>
                                            <span>Current Selection ({draftStats.selectedCount} of {draftStats.totalItems} Products Selected)</span>
                                        </h3>
                                        <p className="text-[11px] text-gray-600 mt-0.5">
                                            Choose products manually or use Knapsack / TOPSIS below to automatically allocate winners.
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[11px] text-gray-500 block font-medium">Total Cost</span>
                                        <span className="text-base font-mono font-bold text-emerald-800">
                                            Rs. {draftStats.totalCost.toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                    {draftStats.itemDetails.map(({ item, chosenProposal, chosenVendor, lineTotal }, idx) => (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                                                chosenVendor ? 'bg-white border-emerald-300 shadow-2xs' : 'bg-white/60 border-dashed border-gray-300'
                                            }`}
                                        >
                                            <div>
                                                <span className="font-semibold text-gray-900 block truncate">
                                                    {idx + 1}. {item.product?.name || `Product #${item.id}`}
                                                </span>
                                                <span className="text-[11px] text-gray-500">
                                                    Qty: {item.quantity || 1} {item.product?.unit || 'units'}
                                                </span>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                                {chosenVendor ? (
                                                    <>
                                                        <span className="text-emerald-950 font-medium truncate text-[11px]">
                                                            ✓ <strong>{chosenVendor.name}</strong> (Rs. {lineTotal.toLocaleString()})
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDraftDeselectProduct(item.id)}
                                                            className="text-rose-600 hover:text-rose-800 text-[11px] underline font-semibold ml-1 cursor-pointer"
                                                            title="Clear selection for this product"
                                                        >
                                                            Clear
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-amber-700 text-[11px] font-medium">
                                                        Not selected yet
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 2. Interactive Optimizer Tools: Knapsack & TOPSIS (Backend Calculated) */}
                            <div className="p-4 bg-gradient-to-r from-emerald-50/60 via-teal-50/40 to-emerald-50/60 border border-emerald-200/80 rounded-xl shadow-2xs">
                                {/* Optimizer Tab Switcher */}
                                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-emerald-200/60">
                                    <div className="flex items-center gap-1.5 p-1 bg-white border border-emerald-200 rounded-lg">
                                        <button
                                            type="button"
                                            onClick={() => setActiveOptimizerTab('knapsack')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                                                activeOptimizerTab === 'knapsack'
                                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>🎒 0/1 Knapsack</span>
                                            <span className="text-[10px] opacity-80 font-normal">(Budget Limit)</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveOptimizerTab('topsis')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                                                activeOptimizerTab === 'topsis'
                                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span>🏆 TOPSIS Optimizer</span>
                                            <span className="text-[10px] opacity-80 font-normal">(Strategic Match)</span>
                                        </button>
                                    </div>

                                    <span className="text-[11px] text-emerald-800 font-semibold hidden sm:inline">
                                        100% Backend Calculated
                                    </span>
                                </div>

                                {/* TAB 1: Knapsack Budget Optimizer */}
                                {activeOptimizerTab === 'knapsack' && (
                                    <div className="pt-3">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                                    <span>0/1 Knapsack Budget Optimizer</span>
                                                </h4>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    Optimally selects vendor bids that maximize item fulfillment under your budget ceiling.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono font-medium">Rs.</span>
                                                    <input
                                                        type="number"
                                                        value={knapsackBudget}
                                                        onChange={(e) => setKnapsackBudget(e.target.value)}
                                                        placeholder="Budget Cap"
                                                        className="pl-8 pr-2.5 py-1.5 text-xs font-mono font-bold text-gray-800 bg-white border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 w-36"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    disabled={isKnapsackLoading}
                                                    onClick={() => handleRunBackendKnapsack()}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                                                    title="Run backend 0/1 Multiple-Choice Knapsack algorithm"
                                                >
                                                    {isKnapsackLoading ? (
                                                        <i className="fa fa-spinner fa-spin"></i>
                                                    ) : (
                                                        <i className="fa fa-bolt"></i>
                                                    )}
                                                    <span>Auto-Allocate</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-gray-500 font-medium">Presets:</span>
                                                {budgetBenchmarks?.minCost > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRunBackendKnapsack(budgetBenchmarks.minCost)}
                                                        className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-md transition cursor-pointer font-mono font-medium text-[11px]"
                                                    >
                                                        Lowest Feasible (Rs. {budgetBenchmarks.minCost.toLocaleString()})
                                                    </button>
                                                )}
                                                {budgetBenchmarks?.estTotal > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRunBackendKnapsack(budgetBenchmarks.estTotal)}
                                                        className="bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-md transition cursor-pointer font-mono font-medium text-[11px]"
                                                    >
                                                        Estimated Budget (Rs. {budgetBenchmarks.estTotal.toLocaleString()})
                                                    </button>
                                                )}
                                            </div>

                                            {knapsackResult && (
                                                <div>
                                                    {knapsackResult.is_fully_covered ? (
                                                        <span className="text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 text-[11px]">
                                                            <i className="fa fa-check-circle text-emerald-600"></i>
                                                            <span>All {knapsackResult.fulfilled_count} items covered (Rs. {knapsackResult.remaining_budget?.toLocaleString()} unspent)</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 text-[11px]">
                                                            <i className="fa fa-exclamation-triangle text-amber-600"></i>
                                                            <span>{knapsackResult.fulfilled_count} of {knapsackResult.total_items_count} items covered under budget</span>
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: TOPSIS Interactive Strategy Optimizer */}
                                {activeOptimizerTab === 'topsis' && (
                                    <div className="pt-3">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                                    <span>TOPSIS Strategic Multi-Criteria Match</span>
                                                </h4>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    Select a strategy to evaluate and select winning proposals of the top-ranked vendor.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {[
                                                    { id: 'balanced', label: 'Balanced' },
                                                    { id: 'cost', label: 'Lowest Price' },
                                                    { id: 'speed', label: 'Fast Delivery' },
                                                    { id: 'quality', label: 'High Rating' },
                                                ].map(strat => (
                                                    <button
                                                        key={strat.id}
                                                        type="button"
                                                        onClick={() => handleRunBackendTopsis(strat.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                                                            topsisStrategy === strat.id
                                                                ? 'bg-emerald-600 text-white shadow-2xs'
                                                                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                                                        }`}
                                                    >
                                                        <span>{strat.label}</span>
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    disabled={isTopsisLoading}
                                                    onClick={() => handleRunBackendTopsis(topsisStrategy)}
                                                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                    title="Auto-select top TOPSIS match"
                                                >
                                                    {isTopsisLoading ? (
                                                        <i className="fa fa-spinner fa-spin"></i>
                                                    ) : (
                                                        <i className="fa fa-trophy"></i>
                                                    )}
                                                    <span>Auto-Select</span>
                                                </button>
                                            </div>
                                        </div>

                                        {topsisResult && (
                                            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                                                <span className="text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-md font-semibold inline-flex items-center gap-1.5">
                                                    <i className="fa fa-trophy text-emerald-600"></i>
                                                    <span>
                                                        Top Match: <strong>{topsisResult.top_vendor?.name}</strong> ({topsisResult.top_vendor?.percentage}% score &bull; {topsisResult.strategy_label}) &bull; Total: Rs. {Number(topsisResult.total_cost).toLocaleString()}
                                                    </span>
                                                </span>
                                                <span className="text-gray-500 font-medium">
                                                    {topsisResult.fulfilled_count} of {topsisResult.total_items_count} products selected
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* 3. List of Vendors with Products */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Vendors & Quoted Products
                                </h3>

                                {sortedVendorApplications.map((app) => {
                                    const vendor = app.vendor;
                                    const proposals = app.proposals || [];
                                    const topsis = pageRankings[app.id] || app.topsis;
                                    const vendorTotal = proposals.reduce((sum, p) => sum + (Number(p.price) * (p.purchase_request_item?.quantity || 1)), 0);

                                    const selectedInDraftCount = proposals.filter(p => draftSelections[p.purchase_request_item_id] === p.id).length;
                                    const isAllVendorSelectedInDraft = proposals.length > 0 && selectedInDraftCount === proposals.length;
                                    const isSomeVendorSelectedInDraft = selectedInDraftCount > 0;

                                    return (
                                        <div
                                            key={app.id}
                                            className={`rounded-xl border transition overflow-hidden shadow-2xs ${
                                                isSomeVendorSelectedInDraft ? 'border-emerald-400 bg-emerald-50/20' : 'border-gray-200 bg-white'
                                            }`}
                                        >
                                            {/* Vendor Card Header */}
                                            <div className="p-3.5 bg-gray-50/90 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-sm font-bold text-gray-900">
                                                            {vendor?.name || `Vendor #${app.id}`}
                                                        </h4>
                                                        {topsis && (
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                                topsis.rank === 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'
                                                            }`}>
                                                                Rank #{topsis.rank} {topsis.rank === 1 && '(Top Match)'}
                                                            </span>
                                                        )}
                                                        {isSomeVendorSelectedInDraft && (
                                                            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                                                                {selectedInDraftCount} of {proposals.length} selected
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                                                        <span>
                                                            Rating: <strong className="text-amber-500 font-bold">{Number(vendor?.rating || 5).toFixed(1)} ★</strong>
                                                        </span>
                                                        <span>&bull;</span>
                                                        <span>Delivery: <strong className="text-gray-700">{app.delivery_date || '-'}</strong></span>
                                                        <span>&bull;</span>
                                                        <span>
                                                            Total Bid: <strong className="font-mono text-gray-900">Rs. {vendorTotal.toLocaleString()}</strong>
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action on Vendor Card */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {isAllVendorSelectedInDraft ? (
                                                        <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5">
                                                            <i className="fa fa-check-circle text-emerald-600"></i>
                                                            <span>All Products Selected</span>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDraftSelectVendor(app)}
                                                            className="bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 hover:border-emerald-400 font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition inline-flex items-center gap-1.5 cursor-pointer"
                                                            title="Select all products from this vendor"
                                                        >
                                                            <i className="fa fa-check-square"></i>
                                                            <span>Select Entire Vendor</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Products Quoted by Vendor */}
                                            <div className="p-2.5 overflow-x-auto">
                                                <table className="w-full text-left text-xs border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-gray-200 text-gray-500 font-semibold bg-gray-50/50">
                                                            <th className="p-2">S.N.</th>
                                                            <th className="p-2">Product</th>
                                                            <th className="p-2">Unit</th>
                                                            <th className="p-2">Qty</th>
                                                            <th className="p-2 text-right">Unit Price</th>
                                                            <th className="p-2 text-right">Total Price</th>
                                                            <th className="p-2 text-center">Select</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {proposals.map((proposal, pIdx) => {
                                                            const reqItem = eoi.purchase_request_items?.find(it => it.id === proposal.purchase_request_item_id) || proposal.purchase_request_item;
                                                            const isSelected = draftSelections[proposal.purchase_request_item_id] === proposal.id;
                                                            const isOtherVendorSelected = !isSelected && Boolean(draftSelections[proposal.purchase_request_item_id]);
                                                            const qty = reqItem?.quantity || 1;
                                                            const lineTotal = Number(proposal.price) * qty;

                                                            const allItemProposals = reqItem?.proposals || [];
                                                            const minPrice = allItemProposals.length > 0 ? Math.min(...allItemProposals.map(p => Number(p.price) || Infinity)) : 0;
                                                            const isLowest = Number(proposal.price) <= minPrice;

                                                            return (
                                                                <tr key={proposal.id} className={`hover:bg-gray-50/80 transition ${isSelected ? 'bg-emerald-50/60 font-medium' : ''}`}>
                                                                    <td className="p-2 text-gray-400">{pIdx + 1}</td>
                                                                    <td className="p-2 font-semibold text-gray-900">
                                                                        {reqItem?.product?.name || `Product #${proposal.purchase_request_item_id}`}
                                                                    </td>
                                                                    <td className="p-2 text-gray-600">{reqItem?.product?.unit || 'units'}</td>
                                                                    <td className="p-2 text-gray-600">{qty}</td>
                                                                    <td className="p-2 text-right font-mono">
                                                                        <div className="flex items-center justify-end gap-1.5">
                                                                            {isLowest && (
                                                                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                                                                                    Lowest
                                                                                </span>
                                                                            )}
                                                                            <span>Rs. {Number(proposal.price).toLocaleString()}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 text-right font-mono font-semibold text-gray-900">
                                                                        Rs. {lineTotal.toLocaleString()}
                                                                    </td>
                                                                    <td className="p-2 text-center">
                                                                        {isSelected ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDraftDeselectProduct(proposal.purchase_request_item_id)}
                                                                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-xs shadow-2xs transition cursor-pointer"
                                                                                title="Click to deselect"
                                                                            >
                                                                                <i className="fa fa-check"></i> Selected
                                                                            </button>
                                                                        ) : isOtherVendorSelected ? (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDraftSelectProduct(proposal.purchase_request_item_id, proposal.id)}
                                                                                className="px-2.5 py-1 text-xs font-medium rounded bg-white border border-gray-300 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition cursor-pointer"
                                                                                title="Switch to this vendor for this product"
                                                                            >
                                                                                Select Instead
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDraftSelectProduct(proposal.purchase_request_item_id, proposal.id)}
                                                                                className="px-2.5 py-1 text-xs font-semibold rounded bg-white hover:bg-emerald-600 text-gray-700 hover:text-white border border-gray-300 hover:border-emerald-600 shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                                                                                title="Select this product"
                                                                            >
                                                                                <i className="fa fa-plus"></i> Select
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAwardModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                >
                                    Close
                                </button>
                                {awardStats.awardedCount > 0 && (
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={handleRevokeAllAwards}
                                        className="px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer disabled:opacity-50"
                                    >
                                        Revoke All Awards
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <span className="text-[11px] text-gray-500 block">Selection Total</span>
                                    <span className="text-xs font-mono font-bold text-gray-900">
                                        Rs. {draftStats.totalCost.toLocaleString()}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    disabled={isSubmitting || draftStats.selectedCount === 0}
                                    onClick={handleSaveAllAwards}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
                                >
                                    <span>
                                        {isSubmitting ? 'Saving Awards...' : `Confirm Awards (${draftStats.selectedCount} of ${draftStats.totalItems} Products)`}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vendor Rating Modal */}
            {ratingModalVendor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold flex items-center gap-2">
                                    <i className="fa fa-star text-amber-300"></i>
                                    <span>Rate Vendor</span>
                                </h2>
                                <p className="text-xs text-emerald-100 mt-0.5">{ratingModalVendor.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRatingModalVendor(null)}
                                className="text-white/80 hover:text-white text-xl font-bold leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmitRating} className="p-6 space-y-4 text-xs">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                                <div>
                                    <span className="text-gray-500 block text-[11px]">Current Rating:</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {Number(ratingModalVendor.rating || 5).toFixed(1)} ★
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-gray-500 block text-[11px]">Total Ratings:</span>
                                    <span className="text-sm font-bold text-gray-900">
                                        {ratingModalVendor.rating_count || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="text-center py-3">
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Choose Rating (1 to 5 Stars):
                                </label>
                                <div className="flex items-center justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setSelectedStars(star)}
                                            onMouseEnter={() => setHoveredStars(star)}
                                            onMouseLeave={() => setHoveredStars(0)}
                                            className="text-3xl transition transform hover:scale-110 focus:outline-none cursor-pointer p-1"
                                        >
                                            <i className={`fa fa-star ${
                                                (hoveredStars || selectedStars) >= star
                                                    ? 'text-amber-400'
                                                    : 'text-gray-300'
                                            }`}></i>
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-2 font-medium text-emerald-800 text-xs min-h-[1.5rem]">
                                    {selectedStars === 5 && '★★★★★ (5 Stars) - Excellent'}
                                    {selectedStars === 4 && '★★★★☆ (4 Stars) - Very Good'}
                                    {selectedStars === 3 && '★★★☆☆ (3 Stars) - Good'}
                                    {selectedStars === 2 && '★★☆☆☆ (2 Stars) - Fair'}
                                    {selectedStars === 1 && '★☆☆☆☆ (1 Star) - Poor'}
                                </div>
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRatingModalVendor(null)}
                                    className="px-3.5 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition font-medium cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-md shadow-xs transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                    {isSubmitting && <i className="fa fa-spinner fa-spin"></i>}
                                    <span>Save Rating</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Vendor Application Detail Modal */}
            {viewingApplication && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-bold flex items-center gap-2">
                                    <span>{viewingApplication.vendor?.name}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                        viewingApplication.status === 'approved'
                                            ? 'bg-emerald-500 text-white'
                                            : viewingApplication.status === 'rejected'
                                            ? 'bg-rose-500 text-white'
                                            : 'bg-amber-500 text-white'
                                    }`}>
                                        {viewingApplication.status}
                                    </span>
                                </h2>
                                <p className="text-xs text-gray-300 mt-0.5">
                                    Application Date: {viewingApplication.application_date} &bull; Delivery Date: {viewingApplication.delivery_date || 'N/A'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingApplication(null)}
                                className="text-white/80 hover:text-white text-xl font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4 text-xs">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div>
                                    <span className="text-gray-500 block text-[11px]">Vendor Rating</span>
                                    <span className="font-bold text-amber-500">
                                        {Number(viewingApplication.vendor?.rating || 5).toFixed(1)} ★
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[11px]">PAN Number</span>
                                    <span className="font-mono text-gray-800">
                                        {viewingApplication.vendor?.pan_number || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[11px]">Email</span>
                                    <span className="text-gray-800 truncate block">
                                        {viewingApplication.vendor?.email || 'N/A'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-[11px]">Phone</span>
                                    <span className="text-gray-800">
                                        {viewingApplication.vendor?.phone_number || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-800 mb-2">Products Quoted</h3>
                                <table className="w-full text-left border border-gray-200 border-collapse">
                                    <thead className="bg-gray-100 text-gray-700 font-semibold border-b">
                                        <tr>
                                            <th className="p-2">Product</th>
                                            <th className="p-2">Qty</th>
                                            <th className="p-2">Unit Price</th>
                                            <th className="p-2 text-right">Total</th>
                                            <th className="p-2 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {viewingApplication.proposals?.map((proposal) => {
                                            const isAwarded = proposal.status === 'awarded';
                                            const qty = proposal.purchase_request_item?.quantity || 1;
                                            return (
                                                <tr key={proposal.id} className={isAwarded ? 'bg-emerald-50/50' : 'bg-white'}>
                                                    <td className="p-2 font-medium text-gray-800">
                                                        {proposal.purchase_request_item?.product?.name}
                                                    </td>
                                                    <td className="p-2 text-gray-600">{qty}</td>
                                                    <td className="p-2 font-mono">Rs. {Number(proposal.price).toLocaleString()}</td>
                                                    <td className="p-2 font-mono text-right font-semibold">
                                                        Rs. {(proposal.price * qty).toLocaleString()}
                                                    </td>
                                                    <td className="p-2 text-center">
                                                        {isAwarded ? (
                                                            <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold text-[10px]">
                                                                Awarded
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-[10px]">Pending</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {viewingApplication.documents && viewingApplication.documents.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-gray-800 mb-2">Attached Documents</h3>
                                    <div className="flex gap-2 flex-wrap">
                                        {viewingApplication.documents.map((doc, idx) => (
                                            <a
                                                key={idx}
                                                href={`/storage/${doc.name}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-xs hover:bg-emerald-100 transition"
                                            >
                                                <i className="fa fa-file-pdf text-rose-500"></i>
                                                <span>{doc.document?.title || doc.name}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setViewingApplication(null)}
                                className="px-4 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-md transition"
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