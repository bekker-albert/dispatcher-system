package kz.shtabai.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class ReminderReceiver extends BroadcastReceiver {
    private int flags(){int f=PendingIntent.FLAG_UPDATE_CURRENT;if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.M)f|=PendingIntent.FLAG_IMMUTABLE;return f;}
    @Override public void onReceive(Context context,Intent intent){
        String action=intent.getAction();String id=intent.getStringExtra("id");String title=intent.getStringExtra("title");String body=intent.getStringExtra("body");String channel=intent.getStringExtra("channel");int requestCode=intent.getIntExtra("requestCode",0);
        if("kz.shtabai.app.SNOOZE".equals(action)){Intent next=new Intent(context,ReminderReceiver.class);next.setAction("kz.shtabai.app.REMIND."+id+".snoozed");next.putExtras(intent);PendingIntent pi=PendingIntent.getBroadcast(context,requestCode,next,flags());AlarmManager am=(AlarmManager)context.getSystemService(Context.ALARM_SERVICE);if(am!=null){long at=System.currentTimeMillis()+10*60*1000L;if(Build.VERSION.SDK_INT>=Build.VERSION_CODES.M)am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pi);else am.set(AlarmManager.RTC_WAKEUP,at,pi);}return;}
        if(title==null||title.trim().isEmpty())title="Напоминание";if(body==null||body.trim().isEmpty())body=title;if(channel==null)channel=MainActivity.CHANNEL_NORMAL;
        NotificationManager nm=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);if(nm==null)return;
        Intent open=new Intent(context,MainActivity.class);open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);PendingIntent content=PendingIntent.getActivity(context,requestCode,open,flags());
        Intent snooze=new Intent(context,ReminderReceiver.class);snooze.setAction("kz.shtabai.app.SNOOZE");snooze.putExtra("id",id);snooze.putExtra("title",title);snooze.putExtra("body",body);snooze.putExtra("channel",channel);snooze.putExtra("requestCode",requestCode);PendingIntent snoozePi=PendingIntent.getBroadcast(context,requestCode+1,snooze,flags());
        Notification.Builder b=Build.VERSION.SDK_INT>=Build.VERSION_CODES.O?new Notification.Builder(context,channel):new Notification.Builder(context);
        Notification n=b.setSmallIcon(android.R.drawable.ic_dialog_info).setContentTitle(title).setContentText(body).setStyle(new Notification.BigTextStyle().bigText(body)).setAutoCancel(true).setContentIntent(content).addAction(new Notification.Action.Builder(android.R.drawable.ic_popup_reminder,"Отложить 10 мин",snoozePi).build()).setPriority(Notification.PRIORITY_HIGH).build();
        nm.notify(requestCode,n);
    }
}
