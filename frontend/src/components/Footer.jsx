import { Link } from "react-router";

const Footer = () => {
  return (
    <div className="text-[#252422] bg-[#F5F5F5] px-4 md:px-12 md:text-lg">
      <h3 className="border-t border-[#252422] pt-4 pb-6 italic">
        Designed and developed by{" "} 
        <Link to={"/yourlink"} className="text-[#944424]">
        Jone Doe
        </Link>
      </h3>
    </div>
  )
}

export default Footer