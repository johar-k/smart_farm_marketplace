"use client"

import { useState } from "react"
import {
  Leaf, LogOut, ShoppingCart, History,
  Star, Settings, Home, User
} from "lucide-react"

import { useLanguage } from "@/lib/language-context"
import { getTranslation } from "@/lib/translations"
import { LanguageSwitcher } from "@/components/language-switcher"

import BrowseCrops from "@/components/consumer/browse-crops"
import CartCheckout from "@/components/consumer/cart-checkout"
import OrderHistory from "@/components/consumer/order-history"
import FarmerRatings from "@/components/consumer/farmer-ratings"
import ConsumerDashboardHome from "@/components/consumer/dashboard-home"
import ConsumerProfile from "@/components/consumer/consumer-profile"

interface ConsumerDashboardProps {
  onLogout: () => void
  onSwitchRole: () => void
}

export default function ConsumerDashboard({ onLogout, onSwitchRole }: ConsumerDashboardProps) {
  const { language } = useLanguage()
  const t = (key: string) => getTranslation(language, key)

  const [activeSection, setActiveSection] = useState<string>("home")
  const [cartItems, setCartItems] = useState<any[]>([])

  // ✅ Logout Confirmation
  const handleLogoutClick = () => {
    const confirmed = window.confirm("Are you sure you want to logout?")
    if (confirmed) {
      onLogout()
    }
  }

  // ✅ Switch Role Confirmation
  const handleSwitchRoleClick = () => {
    const confirmed = window.confirm("Do you want to switch role?")
    if (confirmed) {
      onSwitchRole()
    }
  }

  const navItems = [
    { id: "home", label: t("nav.dashboard"), icon: Home },
    { id: "profile", label: "Profile", icon: User },
    { id: "browse", label: t("nav.browseCrops"), icon: ShoppingCart },
    { id: "cart", label: t("nav.cart"), icon: ShoppingCart },
    { id: "history", label: t("nav.orderHistory"), icon: History },
    { id: "ratings", label: t("nav.farmerRatings"), icon: Star },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-emerald-900 text-white shadow-lg flex flex-col">
        <div className="p-6 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8" />
            <h1 className="text-xl font-bold">Smart Farmer</h1>
          </div>
          <p className="text-emerald-200 text-sm mt-2">
            {t("nav.consumerDashboard")}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-100 hover:bg-emerald-800"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-emerald-800 space-y-2">
          <div className="mb-3">
            <LanguageSwitcher />
          </div>

          {/* ✅ Switch Role */}
          <button
            onClick={handleSwitchRoleClick}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-emerald-100 hover:bg-emerald-800 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">{t("nav.switchRole")}</span>
          </button>

          {/* ✅ Logout */}
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-lg text-emerald-100 hover:bg-red-600 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">{t("nav.logout")}</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-auto p-8">
        {activeSection === "home" && <ConsumerDashboardHome />}
        {activeSection === "profile" && <ConsumerProfile />}
        {activeSection === "browse" && (
          <BrowseCrops onAddToCart={setCartItems} cartItems={cartItems} />
        )}
        {activeSection === "cart" && (
          <CartCheckout cartItems={cartItems} />
        )}
        {activeSection === "history" && <OrderHistory />}
        {activeSection === "ratings" && <FarmerRatings />}
      </div>
    </div>
  )
}
