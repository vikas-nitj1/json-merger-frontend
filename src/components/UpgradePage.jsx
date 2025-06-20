import { useLocation } from "react-router-dom";
import axios from "axios";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe("pk_test_51RajqeCooFgElGx6knar7X2Nwt2aj6KqPOA0i4tw0mBsdpW1QgcY6IXXZ9S7x5cw3Orm6IgcJDgPFudbTkCv59D1001p0qDn8S");

const UpgradePage = () => {
    const location = useLocation();
    const { limitMB, usedMB, attemptedMB } = location.state || {};

    const handleUpgrade = async () => {
        try {
            const stripe = await stripePromise;
            const res = await axios.post("http://localhost:8000/create-checkout-session", {
                price_id: "price_1Rak3lCooFgElGx6iIjeSC3Z",
                quantity: 1,
            });
            await stripe.redirectToCheckout({ sessionId: res.data.sessionId });
        } catch (err) {
            alert(" Failed to redirect to Stripe Checkout: " + err.message);
        }
    };

    return (
        <div className="upgrade-page">
            <h2>You've Exceeded Your Plan</h2>
            <p><strong>Plan Limit:</strong> {limitMB} MB</p>
            <p><strong>Already Used:</strong> {usedMB} MB</p>
            <p><strong>Attempted Upload:</strong> {attemptedMB} MB</p>
            <button className="btn-primary" onClick={handleUpgrade}>
                💳 Upgrade to Yearly Plan ($9)
            </button>
        </div>
    );
};

export default UpgradePage;
