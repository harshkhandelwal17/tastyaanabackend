import { useState } from 'react'
import reactLogo from './assets/react.svg'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import viteLogo from '/vite.svg'
import './App.css'
import OrdersManagement from './OrderManagement'
import VendorManagement from './VendorManagement'
import BhandaraManagement from './BhandaraManagement'

import Dashboard from './Dashboard'
import ProductManagement from './ProductManagement'
import UsersManagement from './UserManagement'
import DeliveryManagement from './DeliveryManagement'
import Subscription from './Subscription'
import Payments from './Payments'
import Support from './Support'
import Main from './Mainpage'
import { Settings } from 'lucide-react';

function App() {

  return (
    <>
    {/* <OrdersManagement/> */}
    {/* <VendorManagement/> */}
    {/* <Dashboard/> */}
    {/* <ProductManagement/> */}
    {/* <UsersManagement/> */}
    {/* <DeliveryManagement/> */}
    {/* <Subscription/> */}
    {/* <Payments/> */}
    {/* <Support/> */}
    


    <BrowserRouter>
            
      <Routes>
        <Route element={<Main/>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<ProductManagement />}/>
        <Route path="/seller" element={<VendorManagement />}/>
        <Route path="/payments" element={<Payments />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/orders" element={<OrdersManagement />}/>
        <Route path="/delivery" element={<DeliveryManagement />}/>
        <Route path="/settings" element={<Settings />}/>
        <Route path="/support" element={<Support />}/>
        <Route path="/subscription" element={<Subscription />}/>
        <Route path="/users" element={<UsersManagement />}/>
        <Route path="/bhandaras" element={<BhandaraManagement />}/>
          </Route>
        
      </Routes>
    </BrowserRouter>
      </>

  )
}

export default App
