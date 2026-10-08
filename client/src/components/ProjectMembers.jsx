import { useState, useEffect } from "react";

function ProjectMembers() {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [project, setProject] = useState(null);
    const [members, setMembers] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [usersResponse, projectsResponse] = await Promise.all([
                    fetch("http://localhost:9000/users"),
                    fetch("http://localhost:9000/projects")
                ]);
                const usersData = await usersResponse.json();
                const projectsData = await projectsResponse.json();

                if (usersResponse.ok && projectsResponse.ok) {
                    setUsers(usersData.users);
                    setProjects(projectsData.projects);
                } else {
                    setIsError(true);
                    setMessage("Could not load users and projects");
                }
            } catch (error) {
                setIsError(true);
                setMessage("Could not connect to the server");
            }
        }
        loadData();
    }, []);

    async function loadMembers(projectId) {
        if (!projectId) {
            setProject(null);
            setMembers([]);
            return;
        }

        setMessage("");
        try {
            const response = await fetch(
                `http://localhost:9000/projects/${projectId}/members`
            );
            const data = await response.json();

            if (response.ok) {
                setProject(data.project);
                setMembers(data.members);
            } else {
                setIsError(true);
                setMessage(data.message);
                setProject(null);
                setMembers([]);
            }
        } catch (error) {
            setIsError(true);
            setMessage("Could not connect to the server");
        }
    }

    function handleSelectProject(event) {
        const projectId = event.target.value;
        setSelectedProjectId(projectId);
        setSelectedUserId("");
        loadMembers(projectId);
    }

    async function handleAddMember(event) {
        event.preventDefault();
        setMessage("");

        if (!selectedUserId) {
            setIsError(true);
            setMessage("Please select a user to add");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:9000/projects/${selectedProjectId}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ user_id: selectedUserId })
                }
            );

            const data = await response.json();
            setIsError(!response.ok);
            setMessage(data.message);

            if (response.ok) {
                setSelectedUserId("");
                loadMembers(selectedProjectId);
            }
        } catch (error) {
            setIsError(true);
            setMessage("Could not connect to the server");
        }
    }

    async function handleRemoveMember(userId) {
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:9000/projects/${selectedProjectId}/members/${userId}`,
                { method: "DELETE" }
            );

            const data = await response.json();
            setIsError(!response.ok);
            setMessage(data.message);

            if (response.ok) {
                loadMembers(selectedProjectId);
            }
        } catch (error) {
            setIsError(true);
            setMessage("Could not connect to the server");
        }
    }

    function displayUser(userId) {
        const user = users.find((entry) => entry._id === userId);
        if (!user) {
            return "Unknown user";
        }
        return `${user.f_name} ${user.l_name} (${user.username})`;
    }

    return (
        <div className="card wide">
            <h2>Manage Memberships</h2>
            <div className="field">
                <label>Project</label>
                <select
                    value={selectedProjectId}
                    onChange={handleSelectProject}
                >
                    <option value="">Select a project</option>
                    {projects.map((entry) => (
                        <option key={entry._id} value={entry._id}>
                            {entry.name}
                        </option>
                    ))}
                </select>
            </div>

            {project && (
                <>
                    <h3>Members of {project.name}</h3>
                    {members.length === 0 ? (
                        <p className="empty">This project has no members.</p>
                    ) : (
                        <ul className="member-list">
                            {members.map((membership) => {
                                const isLead =
                                    membership.user_id ===
                                    project.project_lead_id;
                                return (
                                    <li
                                        key={membership._id}
                                        className="member-row"
                                    >
                                        <span>
                                            {displayUser(membership.user_id)}
                                            {isLead && (
                                                <span className="badge">
                                                    Project Lead
                                                </span>
                                            )}
                                        </span>
                                        {!isLead && (
                                            <button
                                                className="danger"
                                                onClick={() =>
                                                    handleRemoveMember(
                                                        membership.user_id
                                                    )
                                                }
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <form className="inline" onSubmit={handleAddMember}>
                        <select
                            value={selectedUserId}
                            onChange={(event) =>
                                setSelectedUserId(event.target.value)
                            }
                        >
                            <option value="">Select a user</option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>
                                    {user.f_name} {user.l_name} (
                                    {user.username})
                                </option>
                            ))}
                        </select>
                        <button type="submit">Add Member</button>
                    </form>
                </>
            )}

            {message && (
                <p className={isError ? "message error" : "message success"}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default ProjectMembers;
