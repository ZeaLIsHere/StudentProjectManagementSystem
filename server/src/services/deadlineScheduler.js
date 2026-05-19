import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import { PROJECT_STATUS, NOTIFICATION_TYPE } from '../utils/constants.js';

const checkDeadlines = async () => {
  try {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

    const now = new Date();

    const projects = await Project.find({
      status: PROJECT_STATUS.ACTIVE,
      endDate: { $lte: twoDaysFromNow, $gte: now },
    }).populate('members claimedBy');

    for (const project of projects) {
      const existingReminder = await Notification.findOne({
        relatedProject: project._id,
        type: NOTIFICATION_TYPE.DEADLINE_REMINDER,
        createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      });

      if (existingReminder) continue;

      const recipients = [...project.members];
      if (project.claimedBy && !recipients.some(m => m._id.toString() === project.claimedBy._id.toString())) {
        recipients.push(project.claimedBy);
      }

      const daysLeft = Math.ceil((project.endDate - now) / (1000 * 60 * 60 * 24));

      for (const member of recipients) {
        await Notification.create({
          recipient: member._id || member,
          sender: project.owner,
          type: NOTIFICATION_TYPE.DEADLINE_REMINDER,
          title: 'Pengingat Deadline',
          message: `Proyek "${project.title}" akan berakhir dalam ${daysLeft} hari`,
          relatedProject: project._id,
        });
      }
    }
  } catch (error) {
    console.error('Deadline scheduler error:', error.message);
  }
};

const startDeadlineScheduler = () => {
  checkDeadlines();
  setInterval(checkDeadlines, 60 * 60 * 1000);
  console.log('Deadline scheduler started (checks every hour)');
};

export { startDeadlineScheduler, checkDeadlines };
