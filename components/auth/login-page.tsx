"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Leaf } from "lucide-react";

import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import { LanguageSwitcher } from "@/components/language-switcher";

import {
  registerUser,
  loginUser,
  resetPassword,
} from "@/components/dashboards/firebase/auth";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);

  const [activeTab, setActiveTab] = useState<"farmer" | "consumer">("farmer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [location, setLocation] = useState("");
  const [showSignup, setShowSignup] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // =========================
  // SIGN UP
  // =========================
  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const role = activeTab;
      const extraData =
        role === "farmer"
          ? { fullName, farmSize: Number(farmSize), location }
          : { fullName };

      await registerUser(email, password, role, extraData);

      alert(
        "Registration successful! A verification email has been sent. Please verify before login."
      );

      setShowSignup(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGIN
  // =========================
  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const { role } = await loginUser(email, password);

      // 🚫 Wrong tab login
      if (role !== activeTab) {
        alert(
          `You are registered as a ${role}. Please switch to the ${role} tab.`
        );
        return;
      }

      // ✅ Correct redirect
      if (role === "farmer") router.push("/farmer-dashboard");
      if (role === "consumer") router.push("/consumer-dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FORGOT PASSWORD
  // =========================
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your registered email");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      alert("Password reset email sent!");
      setForgotMode(false);
    } catch (err: any) {
      alert("Email not registered or invalid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md shadow-lg border-0">
        <div className="p-8">
          {/* HEADER */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Leaf className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-emerald-900">
              {t("login.title")}
            </h1>
          </div>

          {/* ROLE TABS */}
          {!forgotMode && (
            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              {["farmer", "consumer"].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setActiveTab(role as any)}
                  className={`flex-1 py-2 px-4 rounded-md font-medium ${
                    activeTab === role
                      ? "bg-emerald-600 text-white"
                      : "text-gray-600"
                  }`}
                >
                  {t(`login.${role}`)}
                </button>
              ))}
            </div>
          )}

          {/* FORGOT PASSWORD */}
          {forgotMode ? (
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Enter registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full bg-emerald-600 text-white"
              >
                {loading ? "Sending..." : "Send Reset Email"}
              </Button>

              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full mt-2 text-emerald-700 underline"
              >
                Back to Login
              </button>
            </div>
          ) : !showSignup ? (
            /* LOGIN */
            <div className="space-y-4">
              <Input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-emerald-600 text-white"
              >
                {loading ? "Logging in..." : t("login.loginButton")}
              </Button>

              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="w-full text-sm text-emerald-700"
              >
                Forgot Password?
              </button>

              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="w-full text-emerald-600 font-medium text-sm"
              >
                {t("login.signupLink")}
              </button>
            </div>
          ) : (
            /* SIGNUP */
            <div className="space-y-4">
              <Input
                type="text"
                placeholder={t("login.fullNamePlaceholder")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                type="password"
                placeholder={t("login.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {activeTab === "farmer" && (
                <>
                  <Input
                    type="number"
                    placeholder={t("login.farmSizePlaceholder")}
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                  />

                  <Input
                    type="text"
                    placeholder={t("login.locationPlaceholder")}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </>
              )}

              <Button
                type="button"
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-emerald-600 text-white"
              >
                {loading ? "Creating account..." : t("login.signupButton")}
              </Button>

              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="w-full text-emerald-600 font-medium text-sm"
              >
                {t("login.backToLogin")}
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
