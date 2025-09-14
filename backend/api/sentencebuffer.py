import re


class sentencebuffer:
    def __init__(self):
        self.buffer = (0,"")


    #Update the buffer. Controls the text in the buffer, as well as the buffers index
    def update(self, index, text):
        previous_index = self.get_index()
        previous_text = self.get_text()
        previous_text_len = len(previous_text.split())
        #if index of the incoming text is less than the current buffer index, change the index to be
        #wherever the last sentence stopper is, and change the text to be everything following the stopper
        if index <= previous_index:
            #print("top")
            self.buffer = (index+self.find_last_sentence_stopper_word(text)+1,self.get_trailing_text(text))
            #print("bufferText", self.get_text())
            return
        #If the new index is in the middle of the previous buffer text,
        elif index <= previous_text_len + 1 + previous_index:
            #print("mid")
            stopper_index = self.find_last_sentence_stopper_word(text)
            #print("stopper_index", stopper_index)
            if (stopper_index != -1):
                #print("mid mid")


                valid_text = self.get_trailing_text(text)
                self.buffer = (index+stopper_index+1,valid_text)
                #print("buffer", valid_text)
                return
            #print("index",index)

            previous_words = previous_text.split()
            #print("previous words",previous_words[:index])
            #print("next words", text.split())
            #print("previous_index", previous_index)
            #print("previous_text_len", previous_text_len)
            #valid_buffer_text = f"{" ".join(previous_words[:index])} {text.strip()}"

            valid_buffer_text = " ".join(previous_words[:index-previous_index]+text.split(" "))

            self.buffer = (previous_index,valid_buffer_text)
            #print(valid_buffer_text)
            return
        else:
            #print("bottom")
            #print("BufferIndex",self.get_index(), "TextIndex", index)
            #raise IndexError("Buffered index and new index do not match")
            self.update(index-1, text)

    #returns the index of the word with the sentence stopper.
    def find_last_sentence_stopper_word(self, text):
        match = re.search(r"[.?!](?=[^?.!]*$)", text)
        if match:
            return text[:match.end()].count(" ")
        else:
            return -1
    #Gets the text following a sentence stopper, or
    #if no sentence stopper exists it gets the whole text
    def get_trailing_text(self, text):
        start_index = self.find_last_sentence_stopper_word(text)+1
        words = text.split(" ")
        return (" ".join(words[start_index:])).strip()

    def get_leading_text(self, text):
        end_index = self.find_last_sentence_stopper_word(text)+1
        words = text.split(" ")
        return (" ".join(words[:end_index])).strip()

    def get_query(self, index, text):
        match = re.search(r"[.?!](?=[^?.!]*$)", text)
        if index <= self.get_index():
            self.flush(index)

        if match:
            previous_index = self.get_index()
            query = " ".join(self.get_text().split()[:index-previous_index] + text.split())
            self.update(index, text)
            return query
        else:
            self.update(index, text)
            return self.get_text()

    def get_text(self):
        return self.buffer[1]
    def get_index(self):
        return self.buffer[0]

    def flush(self, index=0):
        self.buffer = (index,"")

    """
    This method is problematic and does not solve the problem it was hoping to solve.
    Get mimimum index is meant to accept an index parameter and if that parameter is lower
    than the buffer index, return that index, otherwise return the buffer index. This does
    not work because the index is tracking the start of a chunk of text, whereas buffer index
    tracks the last sentence stopper. This is a mismatch in function and these indices cannot
    be interchanged.
    
    SOLUTION:
    The browser will need to tell the server where the last sentence stopper is. If that is lower
    than the buffer index, return that one.
    """
    def get_minimum_index(self, index, previous_index):
        if index <  self.get_index():
            return previous_index
        else:
            return self.get_index()

    def __str__(self):
        return f"{self.buffer[0]} {self.buffer[1]}"