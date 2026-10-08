import { useState, useEffect } from "react";

function ProjectList() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    async function loadData() {
        setMessage("");
        try {
            const [projectsResponse, usersResponse] = await Promise.all([
                fetch("http://localhost:9000/projects"),
                fetch("http://localhost:9000/users")
            ]);
            const projectsData = await projectsResponse.json();
            const usersData = await usersResponse.json();

            if (projectsResponse.ok && usersResponse.ok) {
                setProjects(projectsData.projects);
                setUsers(usersData.users);
            } else {
                setIsError(true);
                setMessage("Could not load projects");
            }
        } catch (error) {
            setIsError(true);
            setMessage("Could not connect to the server");
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    function leadName(project) {
        const lead = users.find(
            (user) => user._id === project.project_lead_id
        );
        if (!lead) {
            return "Unknown user";
        }
        return `${lead.f_name} ${lead.l_name} (${lead.username})`;
    }

    return (
        <div className="card wide">
            <div className="card-header">
                <h2>Projects</h2>
                <button className="secondary" onClick={loadData}>
                    Refresh
                </button>
            </div>
            {projects.length === 0 ? (
                <p className="empty">No projects have been created yet.</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Project Lead</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project) => (
                            <tr key={project._id}>
                                <td>{project.name}</td>
                                <td>{project.description}</td>
                                <td>{project.status}</td>
                                <td>{leadName(project)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {message && (
                <p className={isError ? "message error" : "message success"}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default ProjectList;
