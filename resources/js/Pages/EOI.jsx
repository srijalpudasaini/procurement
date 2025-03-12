import EOICard from "@/Components/EOICard"
import InputLabel from "@/Components/Form/InputLabel"
import PrimaryButton from "@/Components/Buttons/PrimaryButton"
import TextInput from "@/Components/Form/TextInput"
import Layout from "@/Layouts/Layout"

const Home = () => {
  return (
    <>
      <Layout>
        <div className="container">
          <h2 className="text-center text-3xl font-bold my-4">Expression Of Interest</h2>
          <div className="flex justify-between items-center">
            <div className="flex">
              <TextInput
                className="py-1 w-72"
              />
              <PrimaryButton className="ms-4" disabled={false}>
                Search
              </PrimaryButton>
            </div>
            <div className="sort">
              <label htmlFor="sort">Sort</label>
              <select name="" id="sort" className="py-1 ms-3">
                <option value="" className="py-1">Date</option>
              </select>
            </div>
          </div>
          <div className="eoi m-4">
            <EOICard />
            <EOICard />
            <EOICard />
            <EOICard />
          </div>
        </div>
      </Layout>
    </>
  )
}

export default Home