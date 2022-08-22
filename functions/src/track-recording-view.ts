import * as functions from "firebase-functions";
import {db} from "./index";

import * as admin from "firebase-admin";

/* BONUS OPPORTUNITY
It's not great (it's bad) to throw all of this code in one file.
Can you help us organize this code better?
*/

export interface Recording {
  id: string; // matches document id in firestore
  creatorId: string; // id of the user that created this recording
  uniqueViewCount: number;
}

export interface User {
  id: string; // matches both the user's document id
  uniqueRecordingViewCount: number; // sum of all recording views
}

export interface Views {
  rID : string; // recording ID
  vID: string; // viewer ID
}

export enum Collections {
  Users = "Users",
  Recordings = "Recordings",
  Views = "Views"
}

export async function trackRecordingView(viewerId: string, recordingId: string): Promise<void> {
  // logs can be viewed in the firebase emulator ui
  functions.logger.debug("viewerId: ", viewerId);
  functions.logger.debug("recordingId: ", recordingId);

  const documentSnapshot = await db.collection("Views").doc(recordingId+viewerId).get();
  if (documentSnapshot.exists) {
    // if recordingID and viewerID combination exists in the Views collection just display it
    const data = documentSnapshot.data();
    functions.logger.debug(data);
  } else {
    // if recordingID and viewerID combination does not exist in the Views collection,
    // add it to Views collection and increment the unique counts
    await db.collection("Views").doc(recordingId+viewerId).set({rID: recordingId, vID: viewerId});

    // incrementing uniqueViewCount; using FieldValue.increment()
    const recordingRef = db.collection("Recordings").doc(recordingId);
    const rRes = await recordingRef.update({
      uniqueViewCount: admin.firestore.FieldValue.increment(1),
    });
    functions.logger.debug("Incremented uniqueViewCount: "+ rRes);

    /*
    I thought about the case where a recording can go viral, but have not implemented it.

    A new collection called Views is created for any recordingId and viewerId combination
    and it will be present only once in the collection. Since the recordingId and viewerId
    will be unique for each recording and viewer respectively it proves correctness for my
    implementation.

    The Views collection will grow tremendously if any of the recordings go viral.
    One solution to deal with such a case is to create ViewsN (N is an integer starteing from 1)
    collection after the first Views collection reaches an agreed upon number of entries (documents)
    A sort of horizontal database sharding.

    The code would have to be adjusted accordingly so as to check the existence of a View throughout
    the shards. Maybe creating an index would help.
    */
    /* incrementing uniqueRecordingViewCount; using FieldValue.increment()
    const viewerRef = db.collection("Users").doc(viewerId);
    const vRes = await viewerRef.update({
      uniqueRecordingViewCount: admin.firestore.FieldValue.increment(1),
    });
    functions.logger.debug("Incremented uniqueRecordingViewCount: "+ vRes);*/
  }
}
