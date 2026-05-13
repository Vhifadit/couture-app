const Notification = require('../models/notification');
const Order = require('../models/order');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user_id: req.user.sub })
      .populate('order_id', 'status service_type date_limite livraison')
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 50);

    res.json({
      count: notifications.length,
      unread: notifications.filter((notification) => !notification.lu).length,
      notifications
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.sub },
      { lu: true, date_lecture: new Date() }
    );
    res.json({ message: 'Notification marquee comme lue' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

const processReminders = async () => {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingOrders = await Order.find({
      status: { $nin: ['DELIVERED', 'COMPLETED', 'CANCELLED'] },
      rappel_24h_envoye: false,
      $or: [
        { 'livraison.date_livraison_prevue': { $gte: now, $lte: in24h } },
        { date_limite: { $gte: now, $lte: in24h } }
      ]
    });

    const lateOrders = await Order.find({
      status: { $nin: ['DELIVERED', 'COMPLETED', 'CANCELLED'] },
      retard_notifie: false,
      $or: [
        { 'livraison.date_livraison_prevue': { $lt: now } },
        { date_limite: { $lt: now } }
      ]
    });

    for (const order of upcomingOrders) {
      await Notification.create([
        { user_id: order.client_id, order_id: order._id, type: 'DELIVERY_REMINDER', titre: 'Livraison proche', message: 'Votre delai de livraison approche.' },
        { user_id: order.couturier_id, order_id: order._id, type: 'DELIVERY_REMINDER', titre: 'Commande a livrer bientot', message: 'Une commande arrive a echeance dans moins de 24h.' }
      ]);
      order.rappel_24h_envoye = true;
      await order.save();
    }

    for (const order of lateOrders) {
      order.is_late = true;
      if (!['LATE', 'READY'].includes(order.status)) order.status = 'LATE';
      order.retard_notifie = true;
      await order.save();
      await Notification.create([
        { user_id: order.client_id, order_id: order._id, type: 'ORDER_LATE', titre: 'Commande en retard', message: 'Votre commande a depasse le delai prevu.' },
        { user_id: order.couturier_id, order_id: order._id, type: 'ORDER_LATE', titre: 'Commande en retard', message: 'Une commande est en retard.' }
      ]);
    }

    return { reminders: upcomingOrders.length, late: lateOrders.length };
};

const runReminders = async (_req, res) => {
  try {
    const result = await processReminders();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

module.exports = { getMyNotifications, markAsRead, runReminders, processReminders };
