import { useNavigate } from "react-router-dom";


function Home() {
    const navigate = useNavigate();
    return (
        <div className="home">
            <h1>Welcome to JSON Tools</h1>
            <button onClick={() => {
                console.log("going to merg the ");
                navigate("/merge")
            }} >🧩 Merge JSON Files</button>
            <button onClick={() => navigate("/formatter")}>🧾 Format JSON</button>
        </div>
    );
}

export default Home;
