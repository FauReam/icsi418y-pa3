import { useState } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";
import "./App.css";

function App() {
    const [page, setPage] = useState("signup");

    const tabs = [
        { id: "signup", label: "Sign Up" },
        { id: "login", label: "Log In" },
        { id: "create", label: "Create Project" },
        { id: "projects", label: "View Projects" },
        { id: "members", label: "Memberships" }
    ];

    return (
        <div className="app">
            <h1>Software Projects</h1>
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={page === tab.id ? "tab active" : "tab"}
                        onClick={() => setPage(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            {page === "signup" && <Signup />}
            {page === "login" && <Login />}
            {page === "create" && <CreateProject />}
            {page === "projects" && <ProjectList />}
            {page === "members" && <ProjectMembers />}
        </div>
    );
}

export default App;
