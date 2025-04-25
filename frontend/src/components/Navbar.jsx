import { Link } from "react-router"
import { useAuthStore } from "../store/authStore"
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useAuthStore();

  console.log("User: ", user)

  const handleLogout = async () => {
    const {message} = await logout();
    toast.success(message);
  }
  return (
    <nav className="bg-[#252422] flex justify-between items-center text-[#FFFCF2] px-4 md:px-12 py-4 md:py-6">
        <Link to="/">
        <label className="font-semibold tracking-wider md:text-lg lg:text-xl cursor-pointer">Thư Viện</label>
        </Link>
        
        {user ? (
          <div className="flex items-center space-x-5 md:text-lg">
            <Link to={"/add-book"}>
            <p className="bg-[#403D39] px-3 py-2">Thêm sách</p></Link>

            <p onClick={handleLogout}>Đăng xuất({user.username})</p>
          </div>
        ) : (
        <div className="flex items-center space-x-5 md:text-lg">
            <Link to={"/login"}><p>Thêm sách</p></Link>
            <Link to={"/login"}><p>Đăng nhập</p></Link>
            <Link to={"/signup"}><p className="bg-[#403D39] px-3 py-2">Đăng ký</p></Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar