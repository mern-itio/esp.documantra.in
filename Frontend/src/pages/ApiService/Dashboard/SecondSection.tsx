import CustomDashboardGraphs from "./CustomDashboardGraph"
import RightWidgets from "./RightWidgets"

const SecondSection = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-8">
  {/* Left Content (Graphs) */}
  <div className="w-full lg:w-2/3">
    <CustomDashboardGraphs /> 
  </div>
  {/* Right Content (Side Widgets/Containers) */}
  <div className="w-full lg:w-1/3">
    <RightWidgets/>
    </div>
</div>

  )
}

export default SecondSection