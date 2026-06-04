import { useEffect, useState } from 'react'
import { Input } from '../components/Input'
import { useAppDispatch } from '../store/hooks'
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../store/slices/authSlice';
import { toast } from 'react-toastify';
import { ERROR_MESSAGES } from '../constants/ERROR_MESSAGES';
import { apiFetch } from '../utils/apiFetch';

export const ForgotPassword = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState("");
    const [timeLeft, setTimeLeft] = useState(15 * 60);

    useEffect(() => {

        const checkResetAccess = async () => {

            try {

            const res = await apiFetch(
                "/api/auth/check-reset-access",
            );

            if (!res.ok) {
                navigate("/");
            }

            } catch {
            navigate("/");
            }
        };

        checkResetAccess();

        }, [navigate]);

        useEffect(() => {

        const timer = setInterval(() => {

            setTimeLeft((prev) => {

            if (prev <= 1) {

                clearInterval(timer);

                toast.error(
                "Reset password session expired"
                );

                navigate("/");

                return 0;
            }

            return prev - 1;
            });

        }, 1000);

        return () => clearInterval(timer);

        }, [navigate]);

const formatTime = (seconds: number) => {

  const mins = Math.floor(seconds / 60);

  const secs = seconds % 60;

  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

    const handleSubmit = async () => {

    if (!password.trim() || !confirmPassword.trim()) {
        setError("Fill all fields.");
        return;
    }

    if (password.length < 8) {
        setError(
        "Password Length should be minimum of 8 characters"
        );
        return;
    }

    if (
        password.trim() !==
        confirmPassword.trim()
    ) {
        setError("Passwords do not match");
        return;
    }

    setError("");


    const result = await dispatch(
        forgotPassword({
        password,
        })
    );


    if (forgotPassword.fulfilled.match(result)) {

        toast.success(
        "Password changed successfully"
        );

        navigate("/");

    } else {

        const raw =
        result.payload ??
        "Failed to change password";

        const message =
        ERROR_MESSAGES[raw] ?? raw;

        toast.error(message);
    }
    };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #0d2a4a 0%, #1a4a7a 50%, #2a5a8a 100%)" }}>
      <nav className="bg-white/95 backdrop-blur-sm px-8 h-[70px] flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="w-10 h-10 bg-[#1a3a6a] rounded-sm flex items-center justify-center">
              <span className="text-white font-black text-lg leading-none">A</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#e8a020] rounded-sm" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-black text-sm tracking-widest" style={{ color: "#e8a020" }}>
              Adnan <span className="text-[#1a3a6a]">TRADING</span>
            </span>
            <span className="text-[11px] text-gray-500 tracking-wide" style={{ fontFamily: "serif" }}>
              Invest In Future.
            </span>
          </div>
        </div>
        <button className="border-2 border-[#1a3a6a] text-[#1a3a6a] font-semibold text-sm px-6 py-2 rounded-full hover:bg-[#1a3a6a] hover:text-white transition-all duration-200">
          Contact Us
        </button>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[620px] bg-white rounded-2xl shadow-2xl shadow-black/20 p-10">

        <p className='mb-5 font-bold text-xl'>Change Password</p>
        <p className="text-sm text-gray-500 mb-6">
            Reset session expires in{" "}
            <span className="font-bold text-red-500">
                {formatTime(timeLeft)}
            </span>
        </p>
        <div className='flex flex-col gap-5'>
         <Input
            label="New Password"
            name="newPassword"
            type="password"
            required
            value={password}
            onChange={(v) => {
                setPassword(v);
                setError("");
            }}
            error={error}
        />

        <Input
            label="Confirm New Password"
            name="confirmNewPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(v) => {
                setConfirmPassword(v);
                setError("");
            }}
            error={error}
        />

        <button
            type="button"
            onClick={handleSubmit}
            className="w-40 mx-auto py-3 rounded-xl text-white font-bold text-base tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(90deg, #4a5a8a 0%, #6a7aaa 50%, #8a9aca 100%)", boxShadow: "0 4px 20px rgba(74,90,138,0.4)" }}
          >            
          Submit
        </button>
        </div>
      </div>
    </div>
 </div>
  )
}

export default ForgotPassword