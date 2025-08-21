import ErrorTypesCard from "./ErrorTypeCard";
import QuickActions from "./QuickActions";
import RecentErrorsCard from "./RecentErrorCard";
import RequestVolumeChart from "./RequestVolumeChart";
import ResponseTimePercentilesChart from "./ResponseTimeChart";
import StatusCodesChart from "./StatusCodeChart";
import TopApiEndpointsChart from "./TopApiChart";

const SecondSection = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 mt-8">
      {/* Left Content (Graphs) */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        <RequestVolumeChart />
        <ResponseTimePercentilesChart />
        <TopApiEndpointsChart />
      </div>
      {/* Right Content (Side Widgets/Containers) */}
      <div className="w-full lg:w-1/3">
        <StatusCodesChart/>
        <ErrorTypesCard/>
        <RecentErrorsCard/>
        <QuickActions/>
      </div>
    </div>
  );
};

export default SecondSection;
