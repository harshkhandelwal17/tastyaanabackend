// // // ============================================
// // // FRONTEND - React Payment Component
// // // ============================================

// // import React, { useState, useCallback } from "react";
// // import { useNavigate } from "react-router-dom";
// // import { useDispatch, useSelector } from "react-redux";

// // // Make sure to include Razorpay script in your HTML
// // // <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

// // const RazorpayPayment = ({
// //   orderData,
// //   customerDetails,
// //   onSuccess,
// //   onFailure,
// //   subscriptionData
// // }) => {
// //   const [isProcessing, setIsProcessing] = useState(false);
// //   const navigate = useNavigate();
// //   const dispatch = useDispatch();
// //   const user = useSelector((state) => state.auth.user);

// //   const initiatePayment = useCallback(async () => {
// //     try {
// //       setIsProcessing(true);

// //       // Create Razorpay order
// //       const response = await fetch(
// //         `${import.meta.env.VITE_BACKEND_URL}/payments/create-order`,
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //             Authorization: `Bearer ${localStorage.getItem("token")}`,
// //           },
// //           body: JSON.stringify({
// //             amount: orderData.totalAmount,
// //             currency: "INR",
// //             orderData,
// //             customerDetails,
// //             subscriptionData
// //           }),
// //         }
// //       );

// //       const data1 = await response.json();
// //       const data = data1.data
// //       console.log("data",data)

// //       if (!data1.success) {
// //         throw new Error(data.message || "Failed to create payment order");
// //       }

// //       // Razorpay options
// //       const options = {
// //         key: import.meta.env.VITE_RAZORPAY_KEY_ID,
// //         amount: data.amount,
// //         currency: data.currency,
// //         name: "Ghar Ka Khana",
// //         description: "Delicious home-style meals",
// //         image: "/logo.png", // Your logo
// //         order_id: data.id,
// //         prefill: {
// //           name:"devndra",
// //           email: "as@gmail.com",
// //           contact: "83",
// //         },
// //         notes: {
// //           orderId: data.Id,
// //         },
// //         theme: {
// //           color: "#F59E0B", // Your brand color
// //         },
// //         modal: {
// //           ondismiss: () => {
// //             setIsProcessing(false);
// //             onFailure?.({
// //               error: { description: "Payment cancelled by user" },
// //             });
// //           },
// //         },
// //         handler: async (response) => {
// //           await handlePaymentSuccess(response, data.Id);
// //         },
// //       };

// //       const razorpay = new window.Razorpay(options);

// //       razorpay.on("payment.failed", async (response) => {
// //         await handlePaymentFailure(response, data.orderId);
// //       });

// //       razorpay.open();
// //     } catch (error) {
// //       console.error("Payment initiation error:", error);
// //       setIsProcessing(false);
// //       onFailure?.({ error: { description: error.message } });
// //     }
// //   }, [orderData, customerDetails, onSuccess, onFailure]);

// // const handlePaymentSuccess = async (response) => {
// //   try {
// //     // Call the processSubscriptionPayment endpoint (not verifyPayment)
// //     const verificationResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/subscriptions/process-payment`, {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //         'Authorization': `Bearer ${localStorage.getItem('token')}`
// //       },
// //       body: JSON.stringify({
// //         razorpay_order_id: response.id,
// //         razorpay_payment_id: response.razorpay_payment_id,
// //         razorpay_signature: response.razorpay_signature
// //       })
// //     });

// //     const verificationData = await verificationResponse.json();

// //     if (verificationData.success) {
// //       // Payment successful and subscription created
// //       onSuccess(verificationData.data);
// //     } else {
// //       throw new Error(verificationData.message || 'Payment verification failed');
// //     }
// //   } catch (error) {
// //     console.error('Payment verification error:', error);
// //     onFailure({ error: { description: error.message } });
// //   }
// // };

// //   const handlePaymentFailure = async (razorpayResponse, orderId) => {
// //     try {
// //       await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/payment-failed`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'application/json',
// //           'Authorization': `Bearer ${localStorage.getItem('token')}`
// //         },
// //         body: JSON.stringify({
// //           orderId: orderId,
// //           razorpay_order_id: razorpayResponse.error.metadata?.order_id,
// //           error: razorpayResponse.error
// //         })
// //       });

// //       setIsProcessing(false);
// //       onFailure?.(razorpayResponse);
// //     } catch (error) {
// //       console.error("Payment failure handling error:", error);
// //       setIsProcessing(false);
// //     }
// //   };

// //   return (
// //     <button
// //       onClick={initiatePayment}
// //       disabled={isProcessing}
// //       className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
// //         isProcessing
// //           ? "bg-gray-300 text-gray-500 cursor-not-allowed"
// //           : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transform hover:scale-105"
// //       }`}
// //     >
// //       {isProcessing ? (
// //         <div className="flex items-center justify-center">
// //           <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
// //             <circle
// //               className="opacity-25"
// //               cx="12"
// //               cy="12"
// //               r="10"
// //               stroke="currentColor"
// //               strokeWidth="4"
// //             ></circle>
// //             <path
// //               className="opacity-75"
// //               fill="currentColor"
// //               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
// //             ></path>
// //           </svg>
// //           Processing Payment...
// //         </div>
// //       ) : (
// //         `Pay ₹${orderData.totalAmount.toFixed(2)}`
// //       )}
// //     </button>
// //   );
// // };

// // export default RazorpayPayment;
// // ============================================
// // FRONTEND - React Payment Component (FIXED)
// // ============================================

// import React, { useState, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";

// // Make sure to include Razorpay script in your HTML
// // <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

// const RazorpayPayment = ({
//   orderData,
//   customerDetails,
//   onSuccess,
//   onFailure,
//   subscriptionData
// }) => {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const user = useSelector((state) => state.auth.user);

//   const initiatePayment = useCallback(async () => {
//     try {
//       setIsProcessing(true);

//       // Create Razorpay order
//       const response = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL}/payments/create-order`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//           body: JSON.stringify({
//             amount: orderData.totalAmount,
//             currency: "INR",
//             orderData,
//             customerDetails,
//             subscriptionData
//           }),
//         }
//       );

//       const responseData1 = await response.json();
//       const responseData = responseData1.data
//       console.log("Backend response:", responseData);

//       if (!responseData1.success) {
//         throw new Error(responseData1.message || "Failed to create payment order");
//       }

//       // Extract the correct data structure from your backend response
//       const {
//         orderId:razorpayOrderId,
//         amount,
//         currency,
//         key,
//         recordId,
//         recordNumber,
//         type
//       } = responseData;

//       // Razorpay options
//       const options = {
//         key: key, // Use the key from backend response
//         amount: amount,
//         currency: currency,
//         name: "Ghar Ka Khana",
//         description: subscriptionData ? "Subscription Plan" : "Delicious home-style meals",
//         image: "/logo.png", // Your logo
//         order_id: razorpayOrderId, // This is the Razorpay order ID
//         prefill: {
//           name: "deve",
//           email: "customerDetails@email.om",
//           contact: "831",
//         },
//         notes: {
//           recordId: recordId,
//           recordNumber: recordNumber,
//           type: type
//         },
//         theme: {
//           color: "#F59E0B", // Your brand color
//         },
//         modal: {
//           ondismiss: () => {
//             setIsProcessing(false);
//             onFailure?.({
//               error: { description: "Payment cancelled by user" },
//             });
//           },
//         },
//         handler: async (response) => {
//           // FIXED: Use correct property names from Razorpay response
//           await handlePaymentSuccess(response, recordId, type);
//         },
//       };

//       const razorpay = new window.Razorpay(options);

//       razorpay.on("payment.failed", async (response) => {
//         await handlePaymentFailure(response, recordId, type);
//       });

//       razorpay.open();
//     } catch (error) {
//       console.error("Payment initiation error:", error);
//       setIsProcessing(false);
//       onFailure?.({ error: { description: error.message } });
//     }
//   }, [orderData, customerDetails, onSuccess, onFailure, subscriptionData]);

//   const handlePaymentSuccess = async (razorpayResponse, recordId, type) => {
//     try {
//       console.log("Razorpay success response:", razorpayResponse);

//       // FIXED: Use correct property names from Razorpay
//       console.log(razorpayResponse)
//       const paymentData = {
//         razorpay_order_id: razorpayResponse.razorpay_order_id,
//         razorpay_payment_id: razorpayResponse.razorpay_payment_id, // This is correct
//         razorpay_signature: razorpayResponse.razorpay_signature,    // This is correct
//         recordId: recordId,
//         type: type
//       };

//       console.log("Sending payment verification:", paymentData);

//       // Use the enhanced handlePaymentSuccess endpoint
//       const verificationResponse = await fetch(
//         `${import.meta.env.VITE_BACKEND_URL}/payments/verify`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('token')}`
//           },
//           body: JSON.stringify(paymentData)
//         }
//       );

//       const verificationData = await verificationResponse.json();
//       console.log("Payment verification response:", verificationData);

//       if (verificationData.success) {
//         setIsProcessing(false);
//         onSuccess?.(verificationData);
//       } else {
//         throw new Error(verificationData.message || 'Payment verification failed');
//       }
//     } catch (error) {
//       console.error('Payment verification error:', error);
//       setIsProcessing(false);
//       onFailure?.({ error: { description: error.message } });
//     }
//   };

//   const handlePaymentFailure = async (razorpayResponse, recordId, type) => {
//     try {
//       console.log("Payment failed:", razorpayResponse);

//       await fetch(`${import.meta.env.VITE_BACKEND_URL}/payment/payment-failed`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         },
//         body: JSON.stringify({
//           recordId: recordId,
//           razorpay_order_id: razorpayResponse.error?.metadata?.order_id,
//           error: razorpayResponse.error,
//           type: type
//         })
//       });

//       setIsProcessing(false);
//       onFailure?.(razorpayResponse);
//     } catch (error) {
//       console.error("Payment failure handling error:", error);
//       setIsProcessing(false);
//     }
//   };

//   return (
//     <button
//       onClick={initiatePayment}
//       disabled={isProcessing}
//       className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
//         isProcessing
//           ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//           : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transform hover:scale-105"
//       }`}
//     >
//       {isProcessing ? (
//         <div className="flex items-center justify-center">
//           <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
//             <circle
//               className="opacity-25"
//               cx="12"
//               cy="12"
//               r="10"
//               stroke="currentColor"
//               strokeWidth="4"
//             ></circle>
//             <path
//               className="opacity-75"
//               fill="currentColor"
//               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//             ></path>
//           </svg>
//           Processing Payment...
//         </div>
//       ) : (
//         `Pay ₹${orderData.totalAmount.toFixed(2)}`
//       )}
//     </button>
//   );
// };

// export default RazorpayPayment;

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

// Make sure to include Razorpay script in your HTML
// <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

const RazorpayPayment = ({
  orderData,
  customerDetails,
  onSuccess,
  onFailure,
  subscriptionData,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const initiatePayment = useCallback(async () => {
    try {
      setIsProcessing(true);

      // Create Razorpay order
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            amount: orderData.totalAmount,
            currency: "INR",
            orderData,
            customerDetails,
            subscriptionData,
          }),
        }
      );

      const responseData = await response.json();
      console.log("Backend response:", responseData);

      if (!responseData.success) {
        throw new Error(
          responseData.message || "Failed to create payment order"
        );
      }

      // Extract the correct data structure from your backend response
      const {
        razorpayOrderId, // Fixed: backend returns razorpayOrderId, not orderId
        amount,
        currency,
        key,
        recordId,
        recordNumber,
        type,
        customerDetails: backendCustomerDetails,
      } = responseData;

      console.log("Extracted payment data:", {
        razorpayOrderId,
        amount,
        currency,
        key,
        recordId,
        recordNumber,
        type,
      });

      // Razorpay options
      const options = {
        key: key, // Use the key from backend response
        amount: amount,
        currency: currency,
        name: "Tastyaana",
        description: subscriptionData
          ? "Subscription Plan"
          : "Delicious home-style meals",
        image: "/logo.png", // Your logo
        order_id: razorpayOrderId, // Fixed: Use razorpayOrderId from backend
        prefill: {
          name: customerDetails.name,
          email: customerDetails.email,
          contact: customerDetails.contact || customerDetails.phone,
        },
        notes: {
          recordId: recordId,
          recordNumber: recordNumber,
          type: type,
        },
        theme: {
          color: "#F59E0B", // Your brand color
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            onFailure?.({
              error: { description: "Payment cancelled by user" },
            });
          },
        },
        handler: async (response) => {
          // Handle successful payment
          await handlePaymentSuccess(response, recordId, type);
        },
      };

      console.log("Razorpay options:", options);

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", async (response) => {
        await handlePaymentFailure(response, recordId, type);
      });

      razorpay.open();
    } catch (error) {
      console.error("Payment initiation error:", error);
      setIsProcessing(false);
      onFailure?.({ error: { description: error.message } });
    }
  }, [orderData, customerDetails, onSuccess, onFailure, subscriptionData]);

  const handlePaymentSuccess = async (razorpayResponse, recordId, type) => {
    try {
      console.log("Razorpay success response:", razorpayResponse);

      // Prepare payment verification data
      const paymentData = {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        recordId: recordId,
        type: type,
      };

      // For subscriptions, add the subscription ID
      if (type === "subscription" && subscriptionData?.subscriptionId) {
        paymentData.subscription_id = subscriptionData.subscriptionId;
        console.log(
          "Added subscription ID to payment data:",
          subscriptionData.subscriptionId
        );
      }

      console.log("Sending payment verification:", paymentData);

      // Choose the correct verification endpoint based on type
      let verificationEndpoint;
      if (type === "subscription") {
        verificationEndpoint = `${
          import.meta.env.VITE_BACKEND_URL
        }/subscriptions/verify-payment`;
      } else {
        verificationEndpoint = `${
          import.meta.env.VITE_BACKEND_URL
        }/payments/verify`;
      }

      // Verify payment with backend
      const verificationResponse = await fetch(verificationEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(paymentData),
      });

      console.log("Verification response status:", verificationResponse.status);

      const verificationData = await verificationResponse.json();
      console.log("Payment verification response:", verificationData);

      if (verificationData.success) {
        setIsProcessing(false);

        // Call onSuccess with the verification data
        onSuccess?.(verificationData);

        // Add a small delay to ensure the success callback is processed
        setTimeout(() => {
          // Navigate based on order type
          if (type === "subscription") {
            // Ensure we have the correct subscription ID
            const subscriptionId =
              verificationData.data?.subscriptionId ||
              verificationData.data?.subscription?._id ||
              subscriptionData?.subscriptionId ||
              recordId;
            // navigate(`/subscription/${subscriptionId}`, {
            //   state: {
            //     subscription:
            //       verificationData.data?.subscription || verificationData.data,
            //     recordNumber:
            //       verificationData.data?.subscriptionIdString ||
            //       verificationData.data?.subscription?.subscriptionId,
            //     paymentStatus: "completed",
            //     paymentVerified: true,
            //   },
            // });
          } else {
            navigate("/orders", {
              state: {
                order: verificationData.data,
                recordNumber: verificationData.data?.orderNumber,
                paymentStatus: "completed",
              },
            });
          }
        }, 500);
      } else {
        throw new Error(
          verificationData.message || "Payment verification failed"
        );
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      setIsProcessing(false);
      onFailure?.({ error: { description: error.message } });
    }
  };

  const handlePaymentFailure = async (razorpayResponse, recordId, type) => {
    try {
      console.log("Payment failed:", razorpayResponse);

      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/payments/payment-failed`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            recordId: recordId,
            razorpay_order_id: razorpayResponse.error?.metadata?.order_id,
            error: razorpayResponse.error,
            type: type,
          }),
        }
      );

      setIsProcessing(false);
      onFailure?.(razorpayResponse);
    } catch (error) {
      console.error("Payment failure handling error:", error);
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={initiatePayment}
      disabled={isProcessing}
      data-razorpay-button="true"
      className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl ${
        isProcessing
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transform hover:scale-105"
      }`}
    >
      {isProcessing ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Processing Payment...
        </div>
      ) : (
        `Pay ₹${orderData.totalAmount.toFixed(2)}`
      )}
    </button>
  );
};

export default RazorpayPayment;
