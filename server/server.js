require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGO_URI);
const db = client.db("pa2");
const users = db.collection("users");
const projects = db.collection("projects");
const memberships = db.collection("projectMemberships");

const STATUSES = ["Planning", "Active", "Completed"];

async function connectDatabase() {
    try {
        await client.connect();
        await users.createIndex({ username: 1 }, { unique: true });
        await memberships.createIndex(
            { project_id: 1, user_id: 1 },
            { unique: true }
        );
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}
connectDatabase();

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

app.post("/signup", async (req, res) => {
    const { f_name, l_name, username, password } = req.body;

    if (!f_name || !l_name || !username || !password) {
        return res.status(400).json({
            message: "Required information is missing"
        });
    }

    try {
        const existing = await users
            .findOne({ username: username }, { collation: { locale: "en", strength: 2 } });
        if (existing) {
            return res.status(409).json({
                message: "Username already exists"
            });
        }

        await users.insertOne({
            f_name: f_name,
            l_name: l_name,
            username: username,
            password: password
        });

        res.status(201).json({
            message: "User created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            message: "Required information is missing"
        });
    }

    try {
        const user = await users
            .findOne({ username: username }, { collation: { locale: "en", strength: 2 } });
        if (!user) {
            return res.status(401).json({
                message: "Username does not exist"
            });
        }

        if (user.password !== password) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        res.status(200).json({
            message: "Login successful"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/users", async (req, res) => {
    try {
        const allUsers = await users
            .find({}, { projection: { password: 0 } })
            .toArray();
        res.status(200).json({ users: allUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/projects", async (req, res) => {
    const { name, description, status, project_lead_id } = req.body;

    if (!name || !description || !status || !project_lead_id) {
        return res.status(400).json({
            message: "Required information is missing"
        });
    }

    if (!STATUSES.includes(status)) {
        return res.status(400).json({
            message: "Status must be Planning, Active, or Completed"
        });
    }

    if (!ObjectId.isValid(project_lead_id)) {
        return res.status(400).json({
            message: "Invalid project lead id"
        });
    }

    try {
        const leadId = new ObjectId(project_lead_id);
        const lead = await users.findOne({ _id: leadId });
        if (!lead) {
            return res.status(404).json({
                message: "Project lead does not exist"
            });
        }

        const result = await projects.insertOne({
            name: name,
            description: description,
            status: status,
            project_lead_id: leadId
        });

        await memberships.insertOne({
            project_id: result.insertedId,
            user_id: leadId
        });

        res.status(201).json({
            message: "Project created successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/projects", async (req, res) => {
    try {
        const allProjects = await projects.find({}).toArray();
        res.status(200).json({ projects: allProjects });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/projects/:projectId/members", async (req, res) => {
    const { projectId } = req.params;

    if (!ObjectId.isValid(projectId)) {
        return res.status(400).json({
            message: "Invalid project id"
        });
    }

    try {
        const project = await projects.findOne({
            _id: new ObjectId(projectId)
        });
        if (!project) {
            return res.status(404).json({
                message: "Project does not exist"
            });
        }

        const projectMembers = await memberships
            .find({ project_id: new ObjectId(projectId) })
            .toArray();

        res.status(200).json({
            project: project,
            members: projectMembers
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.post("/projects/:projectId/members", async (req, res) => {
    const { projectId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({
            message: "Required information is missing"
        });
    }

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(user_id)) {
        return res.status(400).json({
            message: "Invalid project or user id"
        });
    }

    try {
        const projectObjectId = new ObjectId(projectId);
        const userObjectId = new ObjectId(user_id);

        const project = await projects.findOne({ _id: projectObjectId });
        if (!project) {
            return res.status(404).json({
                message: "Project does not exist"
            });
        }

        const user = await users.findOne({ _id: userObjectId });
        if (!user) {
            return res.status(404).json({
                message: "User does not exist"
            });
        }

        const existingMembership = await memberships.findOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });
        if (existingMembership) {
            return res.status(409).json({
                message: "User is already a member of this project"
            });
        }

        await memberships.insertOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });

        res.status(201).json({
            message: "Member added successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.delete("/projects/:projectId/members/:userId", async (req, res) => {
    const { projectId, userId } = req.params;

    if (!ObjectId.isValid(projectId) || !ObjectId.isValid(userId)) {
        return res.status(400).json({
            message: "Invalid project or user id"
        });
    }

    try {
        const projectObjectId = new ObjectId(projectId);
        const userObjectId = new ObjectId(userId);

        const project = await projects.findOne({ _id: projectObjectId });
        if (!project) {
            return res.status(404).json({
                message: "Project does not exist"
            });
        }

        if (project.project_lead_id.equals(userObjectId)) {
            return res.status(400).json({
                message: "The project lead cannot be removed from the project"
            });
        }

        const result = await memberships.deleteOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "User is not a member of this project"
            });
        }

        res.status(200).json({
            message: "Member removed successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.listen(9000, () => {
    console.log("Server running on port 9000");
});
