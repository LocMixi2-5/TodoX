import Task from "../models/Task.js";

export const getAllTasks = async (request, response) => {
    
  const {filter = "today"} = request.query;
  const now = new Date();
  let startDate;

  switch (filter) {
    case "today": {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 2025-09-28 00:00
      break;
    }
    case "week": {
      const mondayDate = 
        now.getDate() - (now.getDay() - 1) - (now.getDay() === 0 ? 7 : 0);
      startDate = new Date(now.getFullYear(), now.getMonth(), mondayDate);
      break;
    }
    case "month": {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case "all": {
    }
    default: {
        startDate = null;
    }
    
  }

  const query = startDate ? { createdAt: { $gte: startDate }, userId: request.user._id } : { userId: request.user._id };

  try{
        const result = await Task.aggregate([
          {$match: query},
          {
            $facet: {
              tasks: [{$sort: {createdAt: -1}}],
              activeCount: [{$match: {status: "active"}}, { $count: "count"}],
              completeCount: [{$match: {status: "complete"}}, { $count: "count"}],


            },
          },
        ]);
        
        const tasks = result[0].tasks;
        const activeCount = result[0].activeCount[0]?.count || 0;
        const completeCount = result[0].completeCount[0]?.count || 0;

        response.status(200).json({ tasks, activeCount, completeCount });

    } catch (error){
        console.error("Lỗi khi gọi getAllTask", error);
        response.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const createTask = async (req, res) => {
    try{
        const {title} = req.body;
        const task = new Task({ title, userId: req.user._id });

        const newTask = await task.save();
        res.status(201).json(newTask);

    } catch (error){
        console.error("Lỗi khi gọi createTask", error);
        res.status(500).json({message: "Lỗi hệ thống"});
    }
};

export const updateTask = async (req, res) => {
  try {
    const { title, status, completedAt } = req.body;
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        title,
        status,
        completedAt
      },
      { new: true } // trả về document đã update
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Nhiệm vụ không tồn tại!" });
    }

    // 🔹 thêm dòng này để trả về dữ liệu sau khi update:
    res.status(200).json(updatedTask);

  } catch (error) {
    console.error("Lỗi khi gọi updateTask", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};


export const deleteTask = async (req, res) => {
    try {
        const deleteTask = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

        if(!deleteTask){
            return res.status(404).json({message: "Nhiệm vụ không tồn tại!"});
        }
        res.status(200).json(deleteTask);

    } catch (error) {
        console.error("Lỗi khi gọi deleteTask", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};
