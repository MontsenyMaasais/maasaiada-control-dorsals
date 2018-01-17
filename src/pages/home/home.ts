import {Component, OnInit, ViewChild} from '@angular/core';
import {IonicFormInput, NavController} from 'ionic-angular';
import {AngularFireDatabase} from 'angularfire2/database';
import {Observable} from 'rxjs/Observable';
import {DateTime} from 'luxon';
import uuidv4 from 'uuid/v4';
import {NFC} from '@ionic-native/nfc';
import get from 'lodash-es/get';
import {AngularFireAuth} from 'angularfire2/auth';

interface ICronoLog {
  control: string;
  dorsal: number;
  nom: string;
  sessio: string;
  timestamp: string;
}

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {
  // log: Observable<any[]>;
  controls: Observable<any[]>;
  sessio: string;
  currentControl: string;
  currentDorsal: number;
  currentNom: string;
  disableBasicInfo = false;
  lastDorsalRegistered: number;
  @ViewChild('inputNumDorsal') inputNumDorsal: IonicFormInput;

  constructor(public navCtrl: NavController,
              public db: AngularFireDatabase,
              private nfc: NFC,
              private firebaseAuth: AngularFireAuth) {
    // this.log = db.list('/log').valueChanges();
    this.controls = db.list('/controls').valueChanges();

    // TODO Need to be set on bootstrap
    this.sessio = uuidv4();
  }

  ngOnInit() {
    this.nfc.addNdefListener(() => {
      console.log('successfully attached ndef listener');
    }, (err) => {
      console.log('error attaching ndef listener', err);
    }).subscribe((event) => {
      // @url https://gist.github.com/don/5544034
      // const nfcTagId: string = this.nfc.bytesToHexString(event.tag.id);
      const nfcPayload: number[] = get(event, 'tag.ndefMessage[0].payload', []);

      if (nfcPayload.length > 3) {
        this.currentDorsal = Number(this.nfc.bytesToString(nfcPayload.slice(3)));
        this.addCronoLog();
      }

      // console.log(event);
      // console.log('received ndef message. the tag contains: ', event.tag);
      // console.log('decoded tag id', this.nfc.bytesToHexString(event.tag.id));
    });
  }

  ionViewCanEnter() {
    return this.firebaseAuth.authState;
  }

  addCronoLogDisabled(): boolean {
    return !this.currentControl || !this.currentDorsal || !this.currentNom;
  }

  addCronoLog() {
    if (this.addCronoLogDisabled()) {
      return;
    }

    const newLog: ICronoLog = {
      control: this.currentControl,
      dorsal: this.currentDorsal,
      nom: this.currentNom,
      sessio: this.sessio,
      timestamp: DateTime.utc().toISO()
    };

    this.db.list('/log/').push(newLog);

    this.lastDorsalRegistered = this.currentDorsal;
    this.currentDorsal = null;
    this.inputNumDorsal.initFocus();
    this.disableBasicInfo = true;
  }
}
