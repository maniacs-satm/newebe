function(doc) {
  if("MicroPost" == doc.doc_type) {
    emit(doc.date, doc);
  }
}

