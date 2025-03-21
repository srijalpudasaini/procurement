import Breadcrumb from "@/Components/ui/Breadcrumb"
import VendorLayout from "@/Layouts/VendorLayout"

const Applications = () => {
  const breadCrumbItems = [
    {
        title: 'Dashboard',
        href: '/vendor/dashboard'
    },
    {
        title: 'EOI Applications',
    }
]
  return (
    <VendorLayout>
        <Breadcrumb items={breadCrumbItems}/>
    </VendorLayout>
  )
}

export default Applications