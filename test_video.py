from ml_service.prediction.predictor import predictor
import cv2
cap=cv2.VideoCapture('ml_service/temp_incident.webm')
events=[]
for _ in range(30):
 ret, frame=cap.read()
 if not ret: break
 pred = predictor.predict_frame(frame, session_id='test')
 events.append(pred['class'])
print('DETECTIONS:', events)
