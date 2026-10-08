import { useState, useEffect } from "react";

function CreateProject() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Planning");
    const [leadId, setLeadId] = useState("");
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await fetch("http://localhost:9000/users");
                const data = await response.json();
                if (response.ok) {
                    setUsers(data.users);
                }
            } catch (error) {
                setIsError(true);
                setMessage("Could not connect to the server");
            }
        }
        loadUsers();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        setMessage("");

        try {
            const response = await fetch("http://localhost:9000/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    description: description,
                    status: status,
                    project_lead_id: leadId
                })
            });

            const data = await response.json();
            setIsError(!response.ok);
            setMessage(data.message);

            if (response.ok) {
                setName("");
                setDescription("");
                setStatus("Planning");
                setLeadId("");
            }
        } catch (error) {
            setIsError(true);
            setMessage("Could not connect to the server");
        }
    }

    return (
        <div className="card">
            <h2>Create Project</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Project Name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />
                <label>Status</label>
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                </select>
                <label>Project Lead</label>
                <select
                    value={leadId}
                    onChange={(event) => setLeadId(event.target.value)}
                >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                        <option key={user._id} value={user._id}>
                            {user.f_name} {user.l_name} ({user.username})
                        </option>
                    ))}
                </select>
                <button type="submit">Create Project</button>
            </form>
            {message && (
                <p className={isError ? "message error" : "message success"}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default CreateProject;
