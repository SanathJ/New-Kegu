import os

import cv2
import tensorflow as tf
import keras_ocr as kocr

import logging
from concurrent import futures
import grpc

import lol_pb2
import lol_pb2_grpc

def crop(image_path="./images/lol.png"):
    img = cv2.imread(image_path)
    original = img.copy()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    thresh = 50
    bw = cv2.threshold(gray, thresh, 255, cv2.THRESH_BINARY)[1]

    contours, hierarchy = cv2.findContours(bw, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    ROI_number = 0
    for cnt in contours:
        if cv2.isContourConvex(cnt) and cv2.contourArea(cnt) > 10000:
            x, y, w, h = cv2.boundingRect(cnt)
            cv2.rectangle(img, (x, y), (x + w, y + h), (0, 255, 0), 2)
            ROI = original[y : y + h, x : x + w]
            cv2.imwrite("./images/ROI_{}.png".format(ROI_number), ROI)
            ROI_number += 1

    images = []
    filenames = []
    for filename in os.listdir("images"):
        if filename.startswith('ROI'):
            images.append(kocr.tools.read(f"images/{filename}"))
            filenames.append(f"images/{filename}")
    
    return images, filenames


def recognize(images, filenames):
    with tf.device("/cpu:0"):
        pipeline = kocr.pipeline.Pipeline()
        prediction_groups = pipeline.recognize(images)

    image_texts = []

    for prediction_lists in prediction_groups:
        texts = []
        for predictions in prediction_lists:
            texts.append(predictions[0])
        image_texts.append(texts)

    for i, images in enumerate(image_texts):
        if "games" in images or "tier" in images:
            return filenames[i]
    
    return "not found"


class Recognizer(lol_pb2_grpc.RecognizerServicer):

    def GetResponse(self, request, context):
        if not os.path.exists("images"):
            os.makedirs("images")

        images, filenames = crop()
        ans = recognize(images, filenames)
        return lol_pb2.Response(filename=ans)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    lol_pb2_grpc.add_RecognizerServicer_to_server(Recognizer(), server)
    server.add_insecure_port('[::]:50051')
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    logging.basicConfig()
    serve()